# CE

## install mySql
### debian
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# Run
 node ./server.js [id1]=[value1] [id2=value2]...

## Optional Arguments
  <table>
    <tr>
      <th>Id</th>
      <th>Value</th>
      <th>Description</th>
    </tr>
    <tr>
      <td>ENV</td>
      <td>['local', 'dev', 'prod']</td>
      <td>sets your environment</td>
    </tr>
    <tr>
      <td>bypass.auth</td>
      <td>true</td>
      <td>will bypass user authentication for testing purposes.</td>
    </tr>
  </table>

# INFO

# TODO v1.2
CREATE NOTIFICATION INTERFACE
create question menue
create view answered/unclear opinions

# TODO clean
  remove old notifications
  removed irrelevant opinions.

## Test
track users open sites
allow users to subscribe to tagged questions
INDIVIDUALFOLLOWERS
  NOTIFY IFOLLOWERS
GROUPFOLLOWERS
  NOTIFY GFOLLOWERS
QUESTIONTAGFOLLOWER
  NOTIFY QFOLLOWERS OF INCLUDED TAG

EXPLANATIONFOLLOWERS
  NOTIFY EFOLOWERS OF INCLUDED TAG

COMMENTTAGFOLLOWERS
  NOTIFY CFOLOWERS OF INCLUDED TAG

add edit comment api
create api answered/unclear opinions
add question opiniontest
add question commenttest
ADD GROUP_ID TO EXPL FOR TEAM EDITING
add merg list api


# TODO later
ADD ORDER, DESC, AND LIMIT to mySqlWrapper
