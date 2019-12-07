# DebugGui

This application is a process specific, cross application logging tool that
provides a easy to use graphical interface that can be added to any html file.

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


### Gui


### Javascript Client


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
