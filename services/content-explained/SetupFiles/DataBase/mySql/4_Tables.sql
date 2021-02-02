
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
  GROUP_ID BIGINT(16),
  AUTHOR_ID BIGINT(16),
  LAST_UPDATE DATETIME,
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
  LAST_UPDATE DATETIME,
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

CREATE TABLE GROUP (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  NAME VARCHAR(64),
  CREATOR_ID BIGINT(16),
  DESCRIPTION TEXT,
  CONSTRAINT FK_GROUP_USER FOREIGN KEY (CREATOR_ID) REFERENCES USER(ID)
);

CREATE TABLE GROUP_CONTRIBUTOR (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  ADMIN INT(1),
  NOTIFY INT(1),
  GROUP_ID BIGINT(16),
  USER_ID BIGINT(16),
  CONSTRAINT FK_GROUP_CONTRIBUTOR_EXPL FOREIGN KEY (EXPLANATION_ID) REFERENCES EXPLANATION(ID),
  CONSTRAINT FK_GROUP_CONTRIBUTOR_GROUP FOREIGN KEY (GROUP_ID) REFERENCES GROUP(ID),
  CONSTRAINT FK_GROUP_CONTRIBUTOR_USER FOREIGN KEY (USER_ID) REFERENCES USER(ID)
);

CREATE TABLE GROUP_EXPLANATION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  GROUP_ID BIGINT(16),
  EXPLANATION_ID BIGINT(16),
  UNIQUE KEY GROUP_EXPLANATION_UNQ_GROUP_EXPLANATION (GROUP_ID, EXPLANATION_ID),
  CONSTRAINT FK_GROUPED_EXPLANATION_ITEM_GROUP FOREIGN KEY (GROUP_ID) REFERENCES GROUP(ID),
  CONSTRAINT FK_GROUPED_EXPLANATION_ITEM_EXPL FOREIGN KEY (EXPLANATION_ID) REFERENCES EXPLANATION(ID)
);

CREATE TABLE GROUPED_OPINION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  USER_ID BIGINT(16),
  GROUP_ID BIGINT(16),
  EXPLANATION_ID BIGINT(16),
  FAVORABLE INT(1),
  UNIQUE KEY GROUPED_OPINION_UNQ_USER_SITE_EXPL (USER_ID, GROUPED_ID, EXPLANATION_ID),
  CONSTRAINT FK_GROUPED_OPINION_USER FOREIGN KEY (USER_ID) REFERENCES USER(ID),
  CONSTRAINT FK_GROUPED_OPINION_EXPL FOREIGN KEY (EXPLANATION_ID) REFERENCES EXPLANATION(ID),
  CONSTRAINT FK_GROUPED_OPINION_GROUP FOREIGN KEY (GROUPED_ID) REFERENCES GROUPED(ID)
);

CREATE TABLE QUESTION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  WORDS_ID BIGINT(16),
  SITE_ID BIGINT(16),
  ELABORATION VARCHAR(250),
  ASKER_ID BIGINT(16),
  UNCLEAR_VOTES BIGINT(16),
  ANSWERED_VOTES BIGINT(16),
  LAST_UPDATE DATETIME,
  CONSTRAINT FK_QUESTION_SITE FOREIGN KEY (SITE_ID) REFERENCES SITE(ID),
  CONSTRAINT FK_QUESTION_USER FOREIGN KEY (ASKER_ID) REFERENCES USER(ID),
  CONSTRAINT FK_QUESTION_WORDS FOREIGN KEY (WORDS_ID) REFERENCES WORDS(ID)
);

CREATE TABLE QUESTION_OPINION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  USER_ID BIGINT(16),
  QUESTION_ID BIGINT(16),
  UNCLEAR INT(1),
  ANSWERED INT(1),
  UNIQUE KEY QOPINION_UNQ_USER_QUESTION (USER_ID, QUESTION_ID),
  CONSTRAINT FK_QOPINION_USER FOREIGN KEY (USER_ID) REFERENCES USER(ID),
  CONSTRAINT FK_QOPINION_QUESTION FOREIGN KEY (QUESTION_ID) REFERENCES QUESTION(ID)
);

CREATE TABLE QUESTION_COMMENT (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  QUESTION_ID BIGINT(16),
  COMMENT_ID BIGINT(16),
  AUTHOR_ID BIGINT(16),
  VALUE TEXT,
  LAST_UPDATE DATETIME,
  CONSTRAINT FK_QCOMMENT_QCOMMENT FOREIGN KEY (COMMENT_ID) REFERENCES QUESTION_COMMENT(ID),
  CONSTRAINT FK_QCOMMENT_USER FOREIGN KEY (AUTHOR_ID) REFERENCES USER(ID),
  CONSTRAINT FK_QCOMMENT_QUESTION FOREIGN KEY (QUESTION_ID) REFERENCES QUESTION(ID)
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
