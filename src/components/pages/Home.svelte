<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

This source code is licensed under the BSD 3-Clause License found in the
LICENSE file in the root directory of this source tree.
-->

<!--
@component
Startseite mit einer Auswahl des startenden Testfalls.
-->

<script>
    import ImageCard from "../basic/ImageCard.svelte";
</script>

<div id="page">
    <h1>Anwendungsfall auswählen</h1>

    <div id="menu">
        <ImageCard img="img/Summary.jpg" href="#/summary">
            Text zusammenfassen
        </ImageCard>

        <ImageCard img="img/Translation.jpg" href="#/translation">
            Text übersetzen
        </ImageCard>

        <ImageCard img="img/QuestionAnswering.jpg" href="#/question-answering">
            Fragen beantworten
        </ImageCard>

        <ImageCard img="img/TextToSpeach.jpg" href="#/text-to-speach">
            Text vorlesen
        </ImageCard>
        
        <ImageCard img="img/SemanticSearch.jpg" href="#/semantic-search">
            Semantische Suche
        </ImageCard>
    </div>
</div>

<style>
    #page {
        flex: 1;
        padding: var(--content-padding);
        overflow: auto;
    }

    #menu {
        margin-top: 2em;
        
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1em;
    }
</style>