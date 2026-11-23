# Release Management

Releases are just tagged commits on GitHub. To cut a consistent new release,
follow the following steps:

1. Bump version number and release date in [CITATION.cff](../CITATION.cff).
   The version also needs to be updated in the `preferred-citation` block.

2. Set the same version number in the following files:
    - [android/package.json](../android/package.json)
    - [app/package.json](../app/package.json)
    - [server/pyproject.toml](../server/pyproject.toml)

3. Update the npm lockfile root versions as well:

   ```sh
   npm --prefix app install --package-lock-only
   npm --prefix android install --package-lock-only
   ```

4. Check the result and stage the changed files:

   ```sh
   git diff --check
   git add CITATION.cff android/package.json android/package-lock.json app/package.json app/package-lock.json server/pyproject.toml
   git diff --cached
   ```

5. Commit the staged files:

   ```sh
   git commit -m "Release vX.Y.Z"
   ```

6. Tag the commit:

   ```sh
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   ```

7. Push the branch and tag to GitHub:

   ```sh
   git push origin HEAD
   git push origin vX.Y.Z
   ```
