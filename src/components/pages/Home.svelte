<!--
Web/Mobile-Test für lokale KI
© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
Lizenziert unter CC0
-->

<!--
@component
Startseite mit einer Auswahl des startenden Testfalls.
-->

<script>
    import ImageCard from "../basic/ImageCard.svelte";
</script>

<div id="page">
    <h1>Testfall auswählen</h1>

    <div id="menu">
        <ImageCard img="img/Summary.jpg" href="#/summary">
            Text zusammenfassen
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