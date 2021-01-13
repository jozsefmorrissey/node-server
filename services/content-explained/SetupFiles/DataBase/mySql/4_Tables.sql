
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

CREATE TABLE TAG (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  VALUE VARCHAR(64) UNIQUE NOT NULL
);

CREATE TABLE EXPLANATION_TAG (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  EXPLANATION_ID BIGINT(16),
  TAG_ID BIGINT(16),
  UNIQUE KEY EXPLANATION_TAG_UNQ_SECRET (EXPLANATION_ID, TAG_ID),
  CONSTRAINT FK_EXPLANATION_TAG_TAG FOREIGN KEY (TAG_ID) REFERENCES TAG(ID),
  CONSTRAINT FK_EXPLANATION_TAG_EXPLANATION FOREIGN KEY (EXPLANATION_ID) REFERENCES EXPLANATION(ID)
);

CREATE TABLE SITE (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  URL TEXT
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

CREATE TABLE QUESTION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  WORDS_ID BIGINT(16),
  SITE_ID BIGINT(16),
  ASKER_ID BIGINT(16),
  CONSTRAINT FK_QUESTION_SITE FOREIGN KEY (SITE_ID) REFERENCES SITE(ID),
  CONSTRAINT FK_QUESTION_USER FOREIGN KEY (ASKER_ID) REFERENCES USER(ID),
  CONSTRAINT FK_QUESTION_WORDS FOREIGN KEY (WORDS_ID) REFERENCES WORDS(ID)
);

CREATE TABLE NOTIFICATION (
  ID BIGINT(16) PRIMARY KEY AUTO_INCREMENT,
  USER_ID BIGINT(16),
  TARGET_ID BIGINT(16),
  SITE_ID BIGINT(16),
  TYPE INT(1),
  REF_TYPE INT(1),
  REF_ID BIGINT(16),
  SEEN INT(1) DEFAULT 0,
  POPPEDUP INT(1) DEFAULT 0,
  CONSTRAINT FK_NOTIFICATION_USER FOREIGN KEY (USER_ID) REFERENCES USER(ID),
  CONSTRAINT FK_NOTIFICATION_SITE FOREIGN KEY (SITE_ID) REFERENCES SITE(ID)
);
