# Interaction logic between user interface and backend

This document explains the workflow of using the web application in the form of sequence diagrams. We start by listing the available panels. Then we explain the basic workflow of connecting to the console and selecting and starting an application on a device.
Finally we explain interactions provided by additional panels of the application.

## UI Panels

The UI consists of the following panels that can be found in their corresponding files of the various [components] folders:
- [`src/components`](../frontend/app/src/components/)
- [`src/features/login-screen/components`](../frontend/app/src/features/login-screen/components)
- [`src/features/zone-detection/components`](../frontend/app/src/features/zone-detection/components)


List of panels:
- [`HeaderBar`](../frontend/app/src/components/HeaderBar.tsx) -- a panel with the name of the app, selected console type and a button to move to the Main View. Also, it contains a button to return to Console selection.
- [`SelectConsolePanel`](../frontend/app/src/features/login-screen/components/SelectConsolePanel.tsx) -- a panel to select which console to use.
- [`OnlineCredentialsPanel`](../frontend/app/src/features/login-screen/components/OnlineCredentialsPanel.tsx) -- a panel to introduce the log in credentials for the online consoles.
- [`DeviceModelSelectionPanel`](../frontend/app/src/features/zone-detection/components/DeviceModelSelectionPanel.tsx) -- a panel for choosing a device, and one of the models currently deployed on it.
- [`ButtonPanel`](../frontend/app/src/features/zone-detection/components/ButtonPanel.tsx) -- a panel that contains buttons to Start/Stop inference.
- [`ImageVisualizationPanel`](../frontend/app/src/features/zone-detection/components/ImageVisualizationPanel.tsx)-- a panel to visualize inference results.
- [`ExtraSettingsPanel`](../frontend/app/src/features/zone-detection/components/ExtraSettingsPanel.tsx) -- a panel to to visualize and edit the device values in a JSON manner.
- [`ConfigurationParameterPanel`](../frontend/app/src/features/zone-detection/components/ConfigurationParameterPanel.tsx) -- a panel for displaying and adjusting the configuration parameters of the app.


## User interaction with UI - basic workflow

The current web application allows to
- connect to a console
- select a device and a detection model model
- perform inference
- set configuration parameters (such as zone selection and different thresholds) for a previously deployed zone detection edge application and to
- visualize the inference results in the form of an image with bounding boxes of the objects detected inside the zone.


The basic workflow is as follows:

```mermaid
---
title:  User interaction with UI - Basic workflow
---
sequenceDiagram
    actor U as User
    participant A as UI

    U -)  +A: Load the app
    A --) -U: Loads a «HeaderBar» and a «DeviceModelSelectionPanel»

    Note over U, A: Interacts with the «SelectConsolePanel»

    U -)  +A: Selects the console type to use
    A --) -U: Enables specifying console credentials
    U -)  +A: Specifies the console credential and presses connect
    A --) -U: Enables choice of device

    Note over U, A: Interacts with the «DeviceModelSelectionPanel»
    U -)  +A: Selects a device
    A --) -U: Enables choice of the model

    U -)  +A: Selects a model
    A --) -U: Enables «Apply» button

    U -)  +A: Clicks the «Apply» button to apply the choice of a device and a model
    A --) -U: Loads the configurations and a reference image


    Note over U, A: Interacts with the «ConfigurationParameterPanel»

    U -)  +A: Clicks the «Selects Zone» button
    A --) -U: Enables selecting the zone on the displayed image and allows to accept the selected zone

    U -)  +A: Sets other configuration parameters using sliders and checkboxes
    A --) -U: Updates the configurations in the frontend

    U -)  +A: Selects the icon of a gear in the parameters configuration section
    A --) -U: Shows the device configuration options in JSON format and enables «Apply» button

    U -)  +A: Adjusts configuration in JSON files and clicks on «Apply»
    A --) -U: Updates the configurations in the frontend

    Note over U, A: Interacts with «ButtonPanel» to start or  stop inference

    U -)  +A: Clicks the «Start Inference» button
    A --) -U: «ImageVisualizationPanel» visualizes the images and inference results

    U -)  +A: Clicks the «Stop Inference» button
    A --) -U: Application stops updating images and inference results <br> and «ImageVisualizationPanel» shows the latest fetched result

```

## Detailed Device and Model information flow (FE-BE interactions)

This sections describes the detailed flow of information to select the console, device, model and edge application to use. These interactions are contained in the the [`DeviceModelSelectionPanel`](../frontend/app/src/features/zone-detection/components/DeviceModelSelectionPanel.tsx) and its components. Once the user selects a console and sets the credentials, this panel allows them to select a device and a model previously deployed on this device. Once the selection is accepted, the application fetches an image and the device configuration, and displays them in the `ImageVisualizationPanel` and `ConfigurationParameterPanel` respectively.

Child components of `DeviceModelSelectionPanel`:
- [*ApplySelection.tsx*](../frontend/app/src/features/zone-detection/components/ApplySelection.tsx)
- [*DeviceSelector.tsx*](../frontend/app/src/features/zone-detection/components/DeviceSelector.tsx)
- [*ModelSelector.tsx*](../frontend/app/src/features/zone-detection/components/ModelSelector.tsx)

Endpoints used by `DeviceModelSelectionPanel` and its children:
- [*Router* `/device`](../backend/app/routers/device.py)
  - `GET /devices/`
  - `GET /devices/{device_id}`
- [*Router* `/configuration`](../backend/app/routers/configuration.py)
  - `GET /configurations/{device_id}`
- [*Router* `/processing`](../backend/app/routers/processing.py)
  - `GET /processing/image/{device_id}`

FE-BE interaction is implemented in:
- [*DeviceInfoFromConsole.tsx*](../frontend/app/src/utils/DeviceInfoFromConsole.tsx)
- [*EdgeAppConfigurationFromConsole.tsx*](../frontend/app/src/utils/EdgeAppConfigurationFromConsole.tsx)
- [*GetImageFromConsole.tsx*](../frontend/app/src/utils/GetImageFromConsole.tsx)


```mermaid
---
title:  Detailed Device and Model information flow (FE-BE interactions)
---
sequenceDiagram
    actor U as User
    box Application
    participant F as FrontEnd
    participant B as BackEnd
    end
  U -)  +F: Go to the app web page
  F --) -U: Renders a screen with a «HeaderBar» and a «SelectConsolePanel»

  U -)  +F: Select a console
    F -) +B: «DeviceModelSelectionPanel» requests a list of available devices <br>using «GET /devices» endpoint
    B --) -F: Return a list of available devices
  F --) -U: Renders the list of all availables devices <br> Renders a disabled dropdown for model selection

  U -)  +F: Select a device
    F -) +B: «DeviceSelector» requests a list of models available on the device<br>using «GET /devices/{device_id}» endpoint
  F --) -U: Enables choosing a model with  the «ModelSelector» component

  B --) -F: Returns a list of models available on the device
  activate F
  F --) U: Rerenders a «ModelSelector» component with updates list of models on device
  deactivate F

  U -)  +F: Select a model from a drop-down menu of a  «ModelSelector» component
  F --) -U: Enables «Apply» button

  U -)  +F: Clicks  «Apply»  button
    F -) +B: ApplySelection component requests a representative image <br>using a «GET /processing/image/{device_id}» endpoint
    F -) +B: ApplySelection component requests the device configuration <br> using a «GET /configurations/{device_id}» endpoint
  activate F
    B --) -F: Returns device configuration
    F --) -U: Renders a «ConfigurationParameterPanel» with parameter values<br>from the obtained configuration info or default values if no configuration is present
  deactivate F
  activate F
    B --) -F: Returns a representative image
    F --) U: Renders «ImageVisualizationPanel» with a reference image and selected zone <br> specified in obtained configuration information
  deactivate F

```

## Detailed Device configuration flow (FE-BE interactions)

This sections describes the flow to interact with the Device/Application configurations. These interactions are contained in the `ConfigurationParameterPanel`. This panel displays the configuration parameters of the zone detection application that a user can change from UI. It includes sliders and checkboxes for some of the parameters, as well as a `SelectZone` button that enables drag-drawing a bounding box on the `ImageVisualizationPanel` to select a zone of interest. All the changes performed on this panel are stored in the Frontend and are only passed to the Backend upon pressing the button "Start Inference" in the `ButtonPanel`.

This panel is first rendered with the default values and is blocked for change while the application is receiving and parsing the device configuration information. Upon its completion, the components are rendered again with the values obtained, and only then the frontend enables modifying its values.

Child components of `ConfigurationParameterPanel`:
- [*CoordinateTable.tsx*](../frontend/app/src/components/CoordinateTable.tsx)
- [*CustomCheckBox.tsx*](../frontend/app/src/components/CustomCheckBox.tsx)
- [*CustomSlider.tsx*](../frontend/app/src/components/CustomSlider.tsx)


```mermaid
---
title: Detailed Device configuration flow (FE-BE interactions)
---
sequenceDiagram
    actor U as User
    box Application
    participant F as FrontEnd
    participant B as BackEnd
    end

  U -)  +F: Clicks  «Apply»  button
    F -) +B: «ApplySelection» component requests the device configuration information <br> using a «GET /configurations/{device_id}» endpoint
  F --) -U: Renders a «ConfigurationParameterPanel» with default parameter values
    B --) -F: Returns configuration information
  activate F
  F --) U: Renders a «ConfigurationParameterPanel» with parameter values<br>from the obtained configuration information
  deactivate F

  U -) +F: Clicks «Select Zone» button
  F --) -U: Enables selecting zone on the canvas of the «ImageVisualizationPanel» <br> Visualizes «CoordinateTable» with the rows "Start Point" and   "End Point"

  U -) +F: Selects a zone by dragging abounding box on  the canvas of the «ImageVisualizationPanel»
  F --) -U: Draws the given rectangle on top of the image and writes the exact pixel values for the start and stop points in the «CoordinateTable»

  U -) +F: Clicks «Accept Zone» button
  F --) -U: Disables zone selection on the canvas of the «ImageVisualizationPanel» <br> Visualizes «CoordinateTable» with the rows "Top Left" and "Bottom Right"

  U -) +F: Updates sliders, value fields or a checkbox
    F --) F: Updates internal representation of selected configuration parameters
  F --) -U: Renders correct representation of the value in all the relevant components

  U -) +F: Selects the icon of a gear in the parameters configuration section
  F --) -U: Renders the «ExtraSettingsPanel» with the device configuration displayed in JSON format <br> Enables «Apply» button

  U -)  +F: Adjusts configuration in JSON files and clicks on «Apply»
    F --) F: Updates internal representation of selected configuration parameters
  F --) -U: Renders «ConfigurationParameterPanel» again <br> Shows updated values in all the relevant components

  U -) +F: Clicks the «Start Inference» button in the «ButtonPanel»
    opt Configuration parameters differ from the previous ones
      F -) +B: «handleStartInference» in «ButtonPanel» checks configuration and calls «PATCH /configurations/{device_id}/{configuration_id}»
      B --) -F: Response
    end

    F -) +B: «handleStartInference» in «ButtonPanel» calls «POST /processing/start_processing/{device_id}»
    B --) -F: Response
    F --) F: Enables receiving images and inference results through a web socket <br>Draws inference results in «ImageVisualizationPanel» <br> Draws telemetry information in «TelemetryPlotPanel»
  F --) -U: Replaces «Start Inference» button with «Stop Inference» button
```

## ButtonPanel

This panel serves to collect together buttons of *Start inference* and *Stop inference*.

Endpoints used by `ButtonPanel` and its children:
- [*Router* `/configuration`](../backend/app/routers/configuration.py):
  - `PATCH /configurations/{file_name}`
- [*Router* `/processing`](../backend/app/routers/processing.py):
  - `POST /processing/start_processing/{device_id}`
  - `POST /processing/stop_processing/{device_id}`

FE-BE interaction for this panel is implemented in:
- [*EdgeAppConfigurationFromConsole.tsx*](../frontend/app/src/utils/EdgeAppConfigurationFromConsole.tsx)
- [*ProcessingService.tsx*](../frontend/app/src/utils/ProcessingService.tsx)


## ImageVisualizationPanel

This panel visualizes images from the camera, and draws bounding boxes on it, be it an inference result or the zone selection.

Child components of `ImageVisualizationPanel`:
- [*Canvas.tsx*](../frontend/app/src/features/zone-detection/components/Canvas.tsx)

Endpoints used by `ImageVisualizationPanel` and its children:
- [*Router* `/processing`](../backend/app/routers/processing.py)
  - Connection to a `/ws`

FE-BE interaction for this panel is implemented in:
- [*ImageStream.tsx*](../frontend/app/src/utils/ImageStream.tsx)


## TelemetryPlotPanel

This panel visualizes a plot with the statistics on the inference results, such as number of objects detected in the zone of interest over time.

Endpoints used by `TelemetryPlotPanel` and its children:
- [*Router* `/processing`](../backend/app/routers/processing.py)
  - Connection to a `/ws`

FE-BE interaction for this panel is implemented in:
- [*ImageStream.tsx*](../frontend/app/src/utils/ImageStream.tsx)


## SelectConsolePanel
This panel allows the user to select which Console to use, from among the listed ones.

Endpoints used by `SelectConsolePanel` and its children:
- [*Router* `/connection`](../backend/app/routers/connection.py)
  - `GET /connection`
  - `PUT /connection`
- [*Router* `/client`](../backend/app/routers/client.py)
  - `GET /client`

FE-BE interaction for this panel is implemented in:
- [*ConsoleConfiguration.tsx*](../frontend/app/src/features/login-screen/utils/ConsoleConfiguration.tsx)


## LocalConfigurationsPanel
This panel allows the user to specify the host address required to access Local Console.

Endpoints used by `LocalConfigurationsPanel` and its children:
- [*Router* `/devices`](../backend/app/routers/device.py)
  - `GET /devices`

FE-BE interaction for this panel is implemented in:
- [*DeviceInfoFromConsole.tsx*](../frontend/app/src/utils/DeviceInfoFromConsole.tsx)


## OnlineCredentialsPanel
This panel allows the user to specify the configuration options required to access any type of Online Console. These options include which endpoints to use, as well as the Client credentials.

Endpoints used by `OnlineCredentialsPanel` and its children:
- [*Router* `/connection`](../backend/app/routers/connection.py)
  - `GET /connection`
  - `PUT /connection`
- [*Router* `/devices`](../backend/app/routers/device.py)
  - `GET /devices`

FE-BE interaction for this panel is implemented in:
- [*DeviceInfoFromConsole.tsx*](../frontend/app/src/utils/DeviceInfoFromConsole.tsx)


## DeviceModelSelectionPanel
This model allows the user to select Device and Model from those available in the selected Console. Initially, only the Device selection is enabled, and once the user has selected a Device, the Model selection is enabled as well, listing all the models in the device.

Endpoints used by `DeviceModelSelectionPanel` and its children:
- [*Router* `/devices`](../backend/app/routers/device.py)
  - `GET /devices/{device_id}`

FE-BE interaction for this panel is implemented in:
- [*DeviceInfoFromConsole.tsx*](../frontend/app/src/utils/DeviceInfoFromConsole.tsx)


## ExtraSettingsPanel
This panel allows the user to visualize and edit the device configuration values in a JSON manner. The exact format of the configuration will depend on various factors, such as the type of Console used or the device selected.

This panel does not communicate with the Backend. The updates in the configuration are stored locally, and communicated to the Backend with starting inference using the [*ButtonPanel*](#buttonpanel).


## ConfigurationParameterPanel
This panel allows the user to visualize and edit the device configuration values using sliders and checkboxes. The list of editable values is hardcoded in the Sample Application, and it's independent of the Console selection.

This panel does not communicate with the Backend. The updates in the configuration are stored locally, and communicated to the Backend with starting inference using the [*ButtonPanel*](#buttonpanel).

