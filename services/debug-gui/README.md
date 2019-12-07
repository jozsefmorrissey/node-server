# DebugGui

This application is a process specific, cross application logging tool that
provides a easy to use graphical interface that can be added to any html file.

# Quick Start
  git clone https://github.com/jozsefmorrissey/node-server.git

  cd ./node-server

  npm install

  node ./node-server.js

  xdg-open http://localhost:3000/debug-gui/html/debug-gui-client-test.html

  press keys 'd' and 'g' at the same time to open.

  use buttons Generate and Refesh to test server and javascript client.

## Key Concepts
  id - A unique identifier for you, so that you don't get someone else's logs.

  group - A period separated string that allows you to group values, links
  and exceptions together in a tree structure.

  root - This should be your application id, it will become the root for your
  subsequent groups.

  value - a simple key value pair.

  link - creates a link to any url that might come in handy during debugging

  exception - Creates a popup with you exception information.

  log - Just a standard string that will be accessible in sequential order.

## Project Map
  <table>
    <tr><td>Server (Logic)</td><td>./debug-gui.js</td></tr>
    <tr><td>Gui</td><td>./js/debug-gui.js</td></tr>
    <tr><td>Javascript Client</td><td>./js/debug-gui-client.js</td></tr>
    <tr><td>Java Client</td><td>./java/DebugGui.java</td></tr>
    <tr><td>Test Html</td><td>./debug-gui-client-test.html</td></tr>
    <tr><td>Server Html</td><td>./debug-gui-server.html</td></tr>
    <tr><td>Parse Html</td><td>./debug-gui-parse.html</td></tr>
  </table>

### Server
  Simple server that just sends and recieves logging information with two
  endpoints to modify the time window of the logs you wish to view. By default
  the server deletes all logging information that is older than 5 minutes.
  this can be changes by modifying the config.json file.

### Gui
 A simple interface with the following functionality.
  - refresh - pulls new data from the server.
  - clean - removes cached logs by the browser on refresh.
  - logs - shows the simple log messages
  - host - enables the gui to communicate with any server
  - id - process unique identifier typically set by the key 'DebugGui.debug'
    auto detected via parameter or cookie. With a preference for parameter,
    since it is more clearly visible to the user.
  - Cookie - Click the cookie to create to activate debugging.
  - Logging Window - The window of time you wish in which you wish to view logs.
  - Copy Html Report - Adds a valid html to the clipboard with the current
    logs attached.

### Javascript Client
    A simple client interface with the following functions.
    - dg.value(group, key, value)
    - dg.link(group, lable, url)
    - dg.exception(group, exception)
    - dg.log(logMessage)
    - dg.setHost(newHostUrl)

### Java Client
  To configure simply set your application root on startup. If you are wanting
  to debug a HttpServletRequest endpoint there are three triggers you could use.
  - Cookie
  - Header
  - Parameter
  The Key for all three is 'DebugGui.debug', the value will become your id.

  If you are not running a server process, you will have to create your own.
  Trigger mechinisms to activate the debugger. The init function also accepts
  a boolean and id.

### Test Html
  This can be used to generate test data to make sure your server and javascript
  client are functioning properly.

### Server Html
  A bare bones html file that will retrieve logs.

### Parse Html
  The main purpose of this functionality is to support sharing of logging
  information. On the gui you will see a "Copy Html Report" button in the upper
  left hand corner. It will create a static html file that you can share with
  colleges.