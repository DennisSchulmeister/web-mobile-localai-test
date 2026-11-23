#!/bin/sh
set -eu

static_root="${1:?Usage: precompress-static <static-root>}"
precompress="${STATIC_PRECOMPRESS:-true}"

case "$precompress" in
    1|true|yes) ;;
    0|false|no|"") precompress=false ;;
    *)
        echo "Unsupported STATIC_PRECOMPRESS value: $precompress (choose true or false)." >&2
        exit 1
        ;;
esac

if [ ! -d "$static_root" ]; then
    echo "Static asset directory does not exist: $static_root" >&2
    exit 1
fi

if [ "$precompress" = false ]; then
    find "$static_root" -type f \( -name '*.onnx' -o -name '*.onnx_data' -o -name '*.onnx_data_*' \) \
        -exec sh -c '
        set -eu

        for file do
            for sidecar in "$file.br" "$file.zst" "$file.gz"; do
                if [ -f "$sidecar" ]; then
                    printf "Deleting %s...\n" "$sidecar"
                    rm -f "$sidecar"
                fi
            done
        done
    ' sh {} +

    echo "Static asset precompression is disabled."
    exit 0
fi

# Skip compression sidecars so subsequent runs don't compress them again.
find "$static_root" -type f \
    ! -name '*.br' \
    ! -name '*.zst' \
    ! -name '*.gz' \
    -exec sh -c '
    set -eu

    for file do
        case "$file" in
            *.onnx|*.onnx_data|*.onnx_data_*)
                for sidecar in "$file.br" "$file.zst" "$file.gz"; do
                    if [ -f "$sidecar" ]; then
                        printf "Deleting %s...\n" "$sidecar"
                        rm -f "$sidecar"
                    fi
                done
                continue
                ;;
        esac

        if [ ! -f "$file.br" ] || [ "$file" -nt "$file.br" ]; then
            printf "Compressing %s with Brotli...\n" "$file"
            brotli -q 11 -k -f "$file"
        fi

        if [ ! -f "$file.zst" ] || [ "$file" -nt "$file.zst" ]; then
            printf "Compressing %s with Zstandard...\n" "$file"
            zstd -19 -q -f "$file" -o "$file.zst"
        fi

        if [ ! -f "$file.gz" ] || [ "$file" -nt "$file.gz" ]; then
            printf "Compressing %s with gzip...\n" "$file"
            gzip -9 -k -f "$file"
        fi
    done
' sh {} +

echo "Precompression finished"
