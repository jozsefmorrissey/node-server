

-- ==========================  USERS  =====================--

DROP DATABASE IF EXISTS CE;
DROP USER IF EXISTS 'CE'@'localhost';

CREATE USER 'CE'@'localhost' IDENTIFIED BY 'ITSJUSTATESTDB';

CREATE DATABASE CE;

GRANT ALL PRIVILEGES ON CE.* TO 'CE'@'localhost';

USE CE;

-- ==========================  SEQUENCES  =====================--

-- CREATE SEQUENCE USER_ID_SEQ START WITH 1050;
-- CREATE SEQUENCE COMPANY_ID_SEQ START WITH 1250;
-- CREATE SEQUENCE FACILITY_ID_SEQ START WITH 10050;
-- CREATE SEQUENCE TASK_ID_SEQ START WITH 1250;
-- CREATE SEQUENCE USER_TASK_ID_SEQ START WITH 71250;
-- CREATE SEQUENCE TIME_SUBMISSION_ID_SEQ START WITH 10050;

-- ==========================  TABLES  =====================--

CREATE TABLE USER (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  USERNAME VARCHAR(64) UNIQUE,
  EMAIL VARCHAR(1024) UNIQUE
);

CREATE TABLE USER_AGENT (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  VALUE VARCHAR(1024) UNIQUE NOT NULL
);

CREATE TABLE IP (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  VALUE VARCHAR(64) UNIQUE NOT NULL
);

CREATE TABLE CREDENTIAL (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  USER_ID BIGINT(16),
  USER_AGENT_ID BIGINT(16),
  IP_ID BIGINT(16),
  SECRET VARCHAR(128),
  ACTIVATION_SECRET VARCHAR(128),
  UNIQUE KEY CREDENTIAL_UK_SECRET (USER_ID, USER_AGENT_ID, IP_ID),
  CONSTRAINT FK_SECRET_USER FOREIGN KEY (USER_ID) REFERENCES USER(ID),
  CONSTRAINT FK_SECRET_IP FOREIGN KEY (IP_ID) REFERENCES IP(ID),
  CONSTRAINT FK_SECRET_USER_AGENT FOREIGN KEY (USER_AGENT_ID) REFERENCES USER_AGENT(ID)
);

CREATE TABLE PENDING_USER_UPDATE (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  USER_ID BIGINT(16),
  UPDATE_SECRET VARCHAR(128),
  USERNAME VARCHAR(64),
  EMAIL VARCHAR(1024),
  CONSTRAINT FK_PENDING_USER_UP_USER FOREIGN KEY (USER_ID) REFERENCES USER(ID)
);

CREATE TABLE WORDS (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  VALUE VARCHAR(64) UNIQUE NOT NULL
);

CREATE TABLE EXPLANATION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  WORDS_ID BIGINT(16),
  SEARCH_WORDS_ID BIGINT(16),
  CONTENT TEXT,
  AUTHOR_ID BIGINT(16),
  CONSTRAINT FK_EXPLANATION_WORD FOREIGN KEY (WORDS_ID) REFERENCES WORDS(ID),
  CONSTRAINT FK_EXPLANATION_SEARCH_WORDS FOREIGN KEY (SEARCH_WORDS_ID) REFERENCES WORDS(ID),
  CONSTRAINT FK_EXPLANATION_USER FOREIGN KEY (AUTHOR_ID) REFERENCES USER(ID)
);

CREATE TABLE SITE_PARTS (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  VALUE TEXT
);

CREATE TABLE SITE (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  ONE_ID BIGINT(16),
  TWO_ID BIGINT(16),
  THREE_ID BIGINT(16),
  FOUR_ID BIGINT(16),
  CONSTRAINT FK_SITE_PARTS_1 FOREIGN KEY (ONE_ID) REFERENCES SITE_PARTS(ID),
  CONSTRAINT FK_SITE_PARTS_2 FOREIGN KEY (TWO_ID) REFERENCES SITE_PARTS(ID),
  CONSTRAINT FK_SITE_PARTS_3 FOREIGN KEY (THREE_ID) REFERENCES SITE_PARTS(ID),
  CONSTRAINT FK_SITE_PARTS_4 FOREIGN KEY (FOUR_ID) REFERENCES SITE_PARTS(ID)
);

CREATE TABLE COMMENT (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  EXPLANATION_ID BIGINT(16),
  COMMENT_ID BIGINT(16),
  SITE_ID BIGINT(16),
  AUTHOR_ID BIGINT(16),
  VALUE TEXT,
  CONSTRAINT FK_COMMENT_COMMENT FOREIGN KEY (COMMENT_ID) REFERENCES COMMENT(ID),
  CONSTRAINT FK_COMMENT_SITE FOREIGN KEY (SITE_ID) REFERENCES SITE(ID),
  CONSTRAINT FK_COMMENT_USER FOREIGN KEY (AUTHOR_ID) REFERENCES USER(ID),
  CONSTRAINT FK_COMMENT_EXPLANATION FOREIGN KEY (EXPLANATION_ID) REFERENCES EXPLANATION(ID)
);

CREATE TABLE OPINION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  USER_ID BIGINT(16),
  EXPLANATION_ID BIGINT(16),
  SITE_ID BIGINT(16),
  FAVORABLE INT(1),
  UNIQUE KEY OPINION_UNQ_USER_SITE_EXPL (USER_ID, SITE_ID, EXPLANATION_ID),
  CONSTRAINT FK_OPINION_USER FOREIGN KEY (USER_ID) REFERENCES USER(ID),
  CONSTRAINT FK_OPINION_EXPL FOREIGN KEY (EXPLANATION_ID) REFERENCES EXPLANATION(ID),
  CONSTRAINT FK_OPINION_SITE FOREIGN KEY (SITE_ID) REFERENCES SITE(ID)
);

CREATE TABLE SITE_EXPLANATION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  SITE_ID BIGINT(16),
  EXPLANATION_ID BIGINT(16),
  UNIQUE KEY SITE_EXPLANATION_UNQ_SITE_EXPLANATION (SITE_ID, EXPLANATION_ID),
  CONSTRAINT FK_SITE_ITEM_SITE FOREIGN KEY (SITE_ID) REFERENCES SITE(ID),
  CONSTRAINT FK_SITE_ITEM_EXPL FOREIGN KEY (EXPLANATION_ID) REFERENCES EXPLANATION(ID)
);

CREATE TABLE TAG (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  VALUE VARCHAR(64) UNIQUE NOT NULL
);

CREATE TABLE GROUPED_EXPLANATION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  WORDS_ID BIGINT(16),
  EXPLANATION_ID BIGINT(16),
  UNIQUE KEY SITE_EXPLANATION_UNQ_SITE_EXPLANATION (WORDS_ID, EXPLANATION_ID),
  CONSTRAINT FK_GROUPED_EXPLANATION_ITEM_WORDS FOREIGN KEY (WORDS_ID) REFERENCES WORDS(ID),
  CONSTRAINT FK_GROUPED_EXPLANATION_ITEM_EXPL FOREIGN KEY (EXPLANATION_ID) REFERENCES EXPLANATION(ID)
);

CREATE TABLE GROUP_EXPLANATION_TAG (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  GROUPED_EXPLANATION_ID BIGINT(16),
  TAG_ID BIGINT(16),
  UNIQUE KEY GROUP_EXPLANATION_TAG_UNQ_SECRET (GROUPED_EXPLANATION_ID, TAG_ID),
  CONSTRAINT FK_GROUP_EXPLANATION_TAG_TAG FOREIGN KEY (TAG_ID) REFERENCES TAG(ID),
  CONSTRAINT FK_GROUP_EXPLANATION_TAG_EXPLANATION FOREIGN KEY (GROUPED_EXPLANATION_ID) REFERENCES GROUPED_EXPLANATION(ID)
);

CREATE TABLE GROUPED_OPINION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  USER_ID BIGINT(16),
  GROUPED_EXPLANATION_ID BIGINT(16),
  FAVORABLE INT(1),
  UNIQUE KEY GROUPED_OPINION_UNQ_USER_SITE_EXPL (USER_ID, GROUPED_EXPLANATION_ID),
  CONSTRAINT FK_GROUPED_OPINION_USER FOREIGN KEY (USER_ID) REFERENCES USER(ID),
  CONSTRAINT FK_GROUPED_OPINION_EXPL FOREIGN KEY (GROUPED_EXPLANATION_ID) REFERENCES GROUPED_EXPLANATION(ID)
);

CREATE TABLE QUESTION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  WORDS_ID BIGINT(16),
  SITE_ID BIGINT(16),
  ASKER_ID BIGINT(16),
  CONSTRAINT FK_QUESTION_SITE FOREIGN KEY (SITE_ID) REFERENCES SITE(ID),
  CONSTRAINT FK_QUESTION_USER FOREIGN KEY (ASKER_ID) REFERENCES USER(ID),
  CONSTRAINT FK_QUESTION_WORDS FOREIGN KEY (WORDS_ID) REFERENCES WORDS(ID)
);

CREATE TABLE EXPLANATION_NOTIFICATION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  USER_ID BIGINT(16),
  SEEN INT(1) DEFAULT 0,
  POPPEDUP INT(1) DEFAULT 0,
  SITE_ID BIGINT(16),
  CONSTRAINT FK_EXPL_NOTIFICATION_USER FOREIGN KEY (USER_ID) REFERENCES USER(ID),
  EXPLANATION_ID BIGINT(16),
  CONSTRAINT FK_NOTIFICATION_EXPL FOREIGN KEY (EXPLANATION_ID) REFERENCES EXPLANATION(ID)
);

CREATE TABLE COMMENT_NOTIFICATION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  USER_ID BIGINT(16),
  SEEN INT(1) DEFAULT 0,
  POPPEDUP INT(1) DEFAULT 0,
  SITE_ID BIGINT(16),
  EXPLANATION_ID BIGINT(16),
  CONSTRAINT FK_COMMENT_NOTIFICATION_USER FOREIGN KEY (USER_ID) REFERENCES USER(ID),
  COMMENT_ID BIGINT(16),
  CONSTRAINT FK_NOTIFICATION_COMMENT FOREIGN KEY (COMMENT_ID) REFERENCES COMMENT(ID),
  CONSTRAINT FK_COMMENT_NOTIFICATION_EXPL FOREIGN KEY (EXPLANATION_ID) REFERENCES EXPLANATION(ID)
);

CREATE TABLE QUESTION_NOTIFICATION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  USER_ID BIGINT(16),
  SEEN INT(1) DEFAULT 0,
  POPPEDUP INT(1) DEFAULT 0,
  SITE_ID BIGINT(16),
  CONSTRAINT FK_Q_NOTIFICATION_USER FOREIGN KEY (USER_ID) REFERENCES USER(ID),
  QUESTION_ID BIGINT(16),
  EXPLANATION_ID BIGINT(16),
  CONSTRAINT FK_Q_NOTIFICATION_QUESTION FOREIGN KEY (QUESTION_ID) REFERENCES QUESTION(ID),
  CONSTRAINT FK_Q_NOTIFICATION_EXPL FOREIGN KEY (EXPLANATION_ID) REFERENCES EXPLANATION(ID)
);

-- ==========================  FUNCTIONS  =====================--

set @row_num = -1;

DELIMITER $$
CREATE FUNCTION ROW_INDEX()
RETURNS BIGINT(16)
DETERMINISTIC
BEGIN
SET @row_num = @row_num + 1;
IF @row_num > 9999999 THEN
	SET @row_num = -1;
END IF;
RETURN (@row_num);
END$$

-- ==========================  Views  =====================--

CREATE OR REPLACE VIEW SITE_DETAIL
AS
SELECT S.*,
		CONCAT(IFNULL(SP1.VALUE, ""),
        IFNULL(SP2.VALUE, ""),
        IFNULL(SP3.VALUE, ""),
        IFNULL(SP4.VALUE, "")) AS URL,
		SP2.VALUE AS HEART
  FROM SITE AS S
	LEFT JOIN SITE_PARTS AS SP1 ON SP1.ID = S.ONE_ID
	LEFT JOIN SITE_PARTS AS SP2 ON SP2.ID = S.TWO_ID
	LEFT JOIN SITE_PARTS AS SP3 ON SP3.ID = S.THREE_ID
	LEFT JOIN SITE_PARTS AS SP4 ON SP4.ID = S.FOUR_ID;

CREATE OR REPLACE VIEW USER_DETAIL
AS
  SELECT
    USER.*,
    IFNULL(LIKES.LIKES, 0) AS LIKES,
    IFNULL(DISLIKES.DISLIKES, 0) AS DISLIKES
    FROM USER
  LEFT JOIN
    (select USER_ID, COUNT(*) AS LIKES from OPINION
      WHERE FAVORABLE = 1 GROUP BY USER_ID, FAVORABLE) AS LIKES
  ON LIKES.USER_ID = ID
  LEFT JOIN
    (select USER_ID, COUNT(*) AS DISLIKES from OPINION
      WHERE FAVORABLE = 0 GROUP BY USER_ID, FAVORABLE) AS DISLIKES
  ON DISLIKES.USER_ID = LIKES.USER_ID;


CREATE OR REPLACE VIEW EXPLANATION_DETAIL
AS
  SELECT
  EXPLANATION.*,
  IFNULL(LIKES.LIKES, 0) AS LIKES,
  IFNULL(DISLIKES.DISLIKES, 0) AS DISLIKES
  FROM EXPLANATION
  LEFT JOIN
    (select EXPLANATION_ID, COUNT(*) AS LIKES from OPINION
      WHERE FAVORABLE = 1 GROUP BY EXPLANATION_ID, FAVORABLE) AS LIKES
  ON LIKES.EXPLANATION_ID = ID
  LEFT JOIN
    (select EXPLANATION_ID, COUNT(*) AS DISLIKES from OPINION
      WHERE FAVORABLE = 0 GROUP BY EXPLANATION_ID, FAVORABLE) AS DISLIKES
  ON DISLIKES.EXPLANATION_ID = ID;


CREATE OR REPLACE VIEW SITE_EXPLANATION_DETAIL
AS
  SELECT
      SITE_EXPLANATION.*,
      SITE.URL,
      IFNULL(LIKES.LIKES, 0) AS LIKES,
      IFNULL(DISLIKES.DISLIKES, 0) AS DISLIKES
  FROM SITE_EXPLANATION LEFT JOIN
    (SELECT EXPLANATION_ID, COUNT(*) AS LIKES, SITE_ID FROM OPINION
      WHERE FAVORABLE=1
      GROUP BY EXPLANATION_ID, FAVORABLE, SITE_ID) AS LIKES
    ON LIKES.EXPLANATION_ID=SITE_EXPLANATION.EXPLANATION_ID AND
    SITE_EXPLANATION.SITE_ID=LIKES.SITE_ID
    LEFT JOIN (SELECT EXPLANATION_ID, COUNT(*) AS DISLIKES, SITE_ID FROM OPINION
      WHERE FAVORABLE=0
      GROUP BY EXPLANATION_ID, FAVORABLE, SITE_ID) AS DISLIKES
    ON DISLIKES.EXPLANATION_ID=SITE_EXPLANATION.EXPLANATION_ID AND
    DISLIKES.SITE_ID = SITE_EXPLANATION.SITE_ID
      LEFT JOIN SITE_DETAIL AS SITE ON SITE.ID = SITE_EXPLANATION.SITE_ID;


CREATE OR REPLACE VIEW EXPLANATION_CONNECTIONS
AS
  SELECT          EXPL.ID AS EXPLANATION_ID,
                  WORDS_ID,
                  COM.AUTHOR_ID AS COMMENTOR_ID,
                  COM.SITE_ID AS COMMENT_SITE_ID,
                  ASKER_ID,
                  QUESTION_ID,
                  QUESTION_SITE_ID
  FROM EXPLANATION AS EXPL
    LEFT JOIN (SELECT * FROM COMMENT) AS COM
      ON COM.EXPLANATION_ID = EXPL.ID
    LEFT JOIN (SELECT ASKER_ID,
                      ID AS QUESTION_ID,
                      WORDS_ID AS Q_WORDS_ID,
                      SITE_ID AS QUESTION_SITE_ID
    FROM QUESTION) AS QS
      ON EXPL.WORDS_ID = QS.Q_WORDS_ID;


CREATE OR REPLACE VIEW COMMENT_CONNECTIONS
AS
  SELECT ROW_INDEX() AS ID,
    COMMENT_ID,
    GUY_D,
    SITE_ID,
		EXPLANATION_ID,
		EXPLANATION_AUTHOR_ID,
    CHILD_COMMENTOR_ID,
    SIBLING_COMMENTOR_ID,
    PARENT_COMMENTOR_ID
  FROM
      (SELECT DISTINCT ID AS COMMENT_ID,
                  EXPLANATION_ID,
                  GUY_D,
                  SITE_ID,
                  EXPLANATION_AUTHOR_ID,
                  CHILD_COMMENTOR_ID,
                  SIBLING_COMMENTOR_ID,
                  PARENT_COMMENTOR_ID
      FROM COMMENT AS COM
        LEFT JOIN (SELECT ID AS CHILD_COMMENT_ID,
                          AUTHOR_ID AS CHILD_COMMENTOR_ID
        FROM COMMENT) AS CHILD
          ON COM.ID = CHILD.CHILD_COMMENT_ID
          LEFT JOIN (SELECT ID AS PARENT_COMMENT_ID,
                            AUTHOR_ID AS PARENT_COMMENTOR_ID
          FROM COMMENT) AS PARENT
            ON COM.COMMENT_ID IS NOT NULL AND
                COM.COMMENT_ID = PARENT.PARENT_COMMENT_ID
          LEFT JOIN (SELECT ID AS SIBLING_COMMENT_ID,
                          SITE_ID AS SIB_SITE_ID,
                          COMMENT_ID AS PARENT_COMMENT_ID3,
                          EXPLANATION_ID AS EXPL_ID,
                          AUTHOR_ID AS SIBLING_COMMENTOR_ID
        FROM COMMENT) AS SIB
          ON (COM.EXPLANATION_ID = SIB.EXPL_ID AND
            COM.EXPLANATION_ID IS NOT NULL AND
            COM.COMMENT_ID IS NULL)
            OR
           (SIB.PARENT_COMMENT_ID3 = COM.COMMENT_ID AND
            COM.COMMENT_ID IS NOT NULL AND
            SIB.SIB_SITE_ID = COM.SITE_ID)
          LEFT JOIN (SELECT ID AS EXPL_ID2,
                            ROW_INDEX() AS GUY_D,
                            AUTHOR_ID AS EXPLANATION_AUTHOR_ID
          FROM EXPLANATION) AS EXPL
            ON EXPL.EXPL_ID2 = COM.EXPLANATION_ID) AS CONTRIBUTERS;
