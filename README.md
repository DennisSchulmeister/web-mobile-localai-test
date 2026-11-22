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
* [Test plan](doc/test-plan.md)

## Screenshots

<!-- Note: Screenshot size in Firefox responsive mode: 530x900 -->
<table>
    <tr>
        <td><a href="./doc/img/welcome.png"><img src="./doc/img/welcome.png" width="200" alt="Welcome page"></a></td>
        <td><a href="./doc/img/index.png"><img src="./doc/img/index.png" width="200" alt="Select a text page"></a></td>
        <td><a href="./doc/img/text-page.png"><img src="./doc/img/text-page.png" width="200" alt="View a text page"></a></td>
        <td><a href="./doc/img/semantic-search.png"><img src="./doc/img/semantic-search.png" width="200" alt="Semantic search"></a></td>
    </tr>
    <tr>
        <td><a href="./doc/img/chat-new.png"><img src="./doc/img/chat-new.png" width="200" alt="Chat introduction"></a></td>
        <td><a href="./doc/img/chat-load-model.png"><img src="./doc/img/chat-load-model.png" width="200" alt="Load a language model"></a></td>
        <td><a href="./doc/img/chat-message.png"><img src="./doc/img/chat-message.png" width="200" alt="Ongoing chat"></a></td>
        <td><a href="./doc/img/backend-info.png"><img src="./doc/img/backend-info.png" width="200" alt="System information"></a></td>
    </tr>
    <tr>
        <td colspan="2"><a href="./doc/img/server-admin-testrun.png"><img src="./doc/img/server-admin-testrun.png" width="400" alt="Recorded test run in the server admin panel"></a></td>
        <td colspan="2"><a href="./doc/img/android-studio.png"><img src="./doc/img/android-studio.png" width="400" alt="App running in the Android Emulator"></a></td>
    </tr>
</table>

## Copyright

**Web/Mobile Test for Local AI**

© 2026 Dennis Schulmeister-Zimolong <[dennis@wpvs.de](mailto:dennis@wpvs.de)> <br>
[Source code licensed under BSD 3-Clause](LICENSE)  <br>
Example data licensed under [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/).
