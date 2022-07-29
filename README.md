# WebGL Shader Editor
A rudimentary WebGL fragment shader editor and viewer.

## Usage
The application requires an HTTP server to function.

### Prerequisites
- The latest version of [Node.js](https://nodejs.org/en/download/). Make sure to install [npm](https://nodejs.org/en/knowledge/getting-started/npm/what-is-npm/) too.
- Basic knowledge of [GLSL](https://www.khronos.org/opengl/wiki/Core_Language_(GLSL)).

### Server Setup
To run the server, you need to run two commands.

#### Windows
1. Navigate to the folder containing the `server.js` file in File Explorer.
2. Hold down Shift and press right click, it should open the context menu.
3. If you have permission on the machine to open PowerShell, you should see a '`Open PowerShell window here`' option. Click on it to open PowerShell.
4. Type the commands below into the PowerShell prompt.

#### MacOS
1. Click the Spotlight Search button in the menu bar.
2. Type in '`console.app`'.
3. Open the terminal, and type the commands below into it.

#### Linux
1. It varies from distro to distro, but the shortcut to open the terminal is usually `Ctrl+Shift+T` or `Ctrl+Alt+T`.
2. Type the commands below into it.

### Commands
Make sure your terminal is in the same directory as the `server.js` file of the application.
1. `npm install` : This installs all the necessary dependencies of the application.
2. `npm start` : This starts the HTTP server for the application.

### Accessing the App
After the HTTP server is started, go to [http://localhost:5501/](http://localhost:5501/).