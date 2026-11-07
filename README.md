# Web/Mobile Test for Local AI

This project explores whether small AI language models can run locally in a web
application on mobile devices with acceptable performance. The prototype supports
summarization, translation, question answering, semantic search, and chat. Running
models locally can keep these interactions offline and their data on the device.

The repository contains:

* A Svelte web application in [`app/`](app/)
* An optional Capacitor Android application in [`android/`](android/)
* A Django backend for recording test cases in [`server/`](server/)
* Docker Compose deployment configuration in [`compose.yaml`](compose.yaml)
* Model and test data preparation scripts in `app/bin/`

## Documentation

### Build and run

* [Build and run the web app](doc/web-app.md)
* [Build and run the Capacitor Android app](doc/android-app.md)
* [Build and run the Django backend](doc/django-backend.md)
* [Docker Compose deployment](doc/docker-compose.md)

### Findings and tests

* [Platform learnings](doc/platform-learnings.md)
* [AI model and use-case learnings](doc/model-learnings.md)
* [Initial test results](doc/initial-test-results.md)
* [Structured test plan](doc/test-plan.md)

## Screenshots

<table>
    <tr>
        <td><a href="./doc/img/screenshot1.png"><img src="./doc/img/screenshot1.png" width="200" alt="Select a text page"></a></td>
        <td><a href="./doc/img/screenshot2.png"><img src="./doc/img/screenshot2.png" width="200" alt="View a text page"></a></td>
        <td><a href="./doc/img/screenshot3.png"><img src="./doc/img/screenshot3.png" width="200" alt="Semantic search"></a></td>
    </tr>
    <tr>
        <td><a href="./doc/img/screenshot4.png"><img src="./doc/img/screenshot4.png" width="200" alt="Chat introduction"></a></td>
        <td><a href="./doc/img/screenshot5.png"><img src="./doc/img/screenshot5.png" width="200" alt="Load a language model"></a></td>
        <td><a href="./doc/img/screenshot6.png"><img src="./doc/img/screenshot6.png" width="200" alt="Ongoing chat"></a></td>
    </tr>
    <tr>
        <td><a href="./doc/img/screenshot7.png"><img src="./doc/img/screenshot7.png" width="200" alt="System information"></a></td>
        <td colspan="2"><a href="./doc/img/android-studio.png"><img src="./doc/img/android-studio.png" width="400" alt="App running in the Android Emulator"></a></td>
    </tr>
</table>

## Copyright

**Web/Mobile Test for Local AI**

© 2026 Dennis Schulmeister-Zimolong <[dennis@wpvs.de](mailto:dennis@wpvs.de)> <br>
[Source code licensed under BSD 3-Clause](LICENSE)  <br>
Example data licensed under [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/).
