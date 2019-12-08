# DebugGui

This application is a process specific, cross application logging tool that
provides a easy to use graphical interface that can be added to any html file.

# Quick Start
  git clone https://github.com/jozsefmorrissey/node-server.git

  cd ./node-server

  npm install

  node ./node-server.js

  navigate to http://localhost:3000/debug-gui/html/debug-gui-client-test.html?DebugGui.debug=name

  press keys 'd' and 'g' at the same time to open.

  Use buttons Generate and Refesh to test server and javascript client.

  Happy Logging!

## Key Concepts
  id - A unique identifier for you, so that you don't get someone else's logs.

  group - A period separated string that allows you to group values, links
  and exceptions together in a tree structure.

  root - This should be your application id, it will become the root for your
  subsequent groups.

  value - Displays a simple key value pair.

  link - Creates a link to any url that might come in handy during debugging.

  exception - Creates a popup with your exception information.

  log - Just a standard string that will be accessible in sequential order.

## Project Map
  <table>
    <tr><td>Server (Logic)</td><td>./debug-gui.js</td></tr>
    <tr><td>Gui</td><td>./js/debug-gui.js</td></tr>
    <tr><td>Javascript Client</td><td>./js/debug-gui-client.js</td></tr>
    <tr><td>Java Client</td><td>./java/DebugGui.java</td></tr>
    <tr><td>Java Test Class</td><td>./java/DebugGuiTest.java</td></tr>
    <tr><td>Test Html</td><td>./debug-gui-client-test.html</td></tr>
    <tr><td>Server Html</td><td>./debug-gui-server.html</td></tr>
    <tr><td>Parse Html</td><td>./debug-gui-parse.html</td></tr>
  </table>

### Server
  Simple server that just sends and recieves logging information. By default
  the server deletes all logging information that is older than 5 minutes.
  this can be changed by modifying the config.json file.

### Gui
 A simple interface with the following functionality.
  - refresh - pulls new data from the server.
  - logs - shows the simple log messages
  - host - enables the gui to communicate with any server
  - id - process unique identifier typically set by the key 'DebugGui.debug'
    auto detected via parameter or cookie. Exception is thrown if a contradiction exists.
  - Cookie - Click the cookie to create and activate debugging.
  - Logging Window - The number of seconds in the past in which you wish to view logs.
  - Copy Html Report - Adds a valid html to the clipboard with the current
    logs attached.

### Javascript Client
    A simple client interface with the following functions.
    - dg.value(group, key, value)
    - dg.link(group, lable, url)
    - dg.exception(group, exception)
    - dg.log(logMessage)
    - dg.setHost(newHostUrl)
    - dg.setRoot(rootGroupName)

    If you dont want to use dg or you want to use seperate debuggers in different locations,
    a new debug configuration can be created with debugGuiClient(root).

### Java Client
  To configure simply set your application root on startup. If you are wanting
  to debug a HttpServletRequest endpoint there are three triggers you could use.
  - Cookie
  - Header
  - Parameter

  The Key for all three is 'DebugGui.debug', the value will become your id. At the
  beginning of a process simply call init(request) and all code executed by that
  process or processes that are spawned will have debugging enabled.

  If you are not running a server process, you will have to create your own
  trigger mechanisms to activate the debugger. The init function also accepts
  a boolean and id.

### Java Client Test
  DebugGuiTest.java Deploys multiple stand alone threads that send data, as well as verifies that
  a threads are inheriting the debug state of their parent. The junit test is not multi threaded
  so a "successful" run does not mean success. There should be no exceptions thrown and at
  the end a list of links that contains logs will be displayed. You have 60 seconds to verify
  those links, the last one is the most important. You should see "projects" 10-19 reporting
  to this id. Dont forget the shortcut command d+g.


### Test Html
  This can be used to generate test data to make sure your server and javascript
  client are functioning properly.

### Server Html
  A bare bones html file that will retrieve logs.

### Parse Html
  The main purpose of this functionality is to support sharing of logging
  information. On the gui you will see a "Copy Html Report" button, in the upper
  right hand corner. It will copy to the clipboard static html file that you can share with
  colleges.
