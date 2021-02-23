
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
  SELECT COMMENT_ID,
    SITE_ID,
    EXPLANATION_ID,
    EXPLANATION_AUTHOR_ID,
    CHILD_COMMENTOR_ID,
    SIBLING_COMMENTOR_ID,
    PARENT_COMMENTOR_ID
  FROM
      (SELECT DISTINCT ID AS COMMENT_ID,
                  EXPLANATION_ID,
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
                            AUTHOR_ID AS EXPLANATION_AUTHOR_ID
          FROM EXPLANATION) AS EXPL
            ON EXPL.EXPL_ID2 = COM.EXPLANATION_ID) AS CONTRIBUTORS;

CREATE OR REPLACE VIEW FOLLOWING
AS
  SELECT
        F.USER_ID,
        F.TARGET_ID,
        GF.GROUP_ID,
        QF.TAG_ID AS QUESTION_TAG_ID,
        EF.TAG_ID AS EXPLANATION_TAG_ID,
        CF.TAG_ID AS COMMENT_TAG_ID
        FROM FOLLOWER AS F
    LEFT JOIN GROUP_FOLLOWER AS GF ON F.USER_ID = GF.USER_ID
    LEFT JOIN QUESTION_TAG_FOLLOWER AS QF ON QF.USER_ID = GF.USER_ID
    LEFT JOIN COMMENT_TAG_FOLLOWER AS CF ON CF.USER_ID = GF.USER_ID
    LEFT JOIN EXPLANATION_TAG_FOLLOWER AS EF ON EF.USER_ID = GF.USER_ID;


CREATE OR REPLACE VIEW GROUPED_EXPLANATION_DETAIL
AS
  SELECT GE.EXPLANATION_ID,
      GE.GROUP_ID,
      IFNULL(SUM(LYKE), 0) AS LIKES,
      IFNULL(SUM(DISLIKE), 0) AS DISLIKES
    FROM GROUPED_EXPLANATION AS GE
    LEFT JOIN GROUPED_OPINION AS GO
      ON GE.EXPLANATION_ID = GO.EXPLANATION_ID AND GE.GROUP_ID = GO.GROUP_ID
            GROUP BY GE.GROUP_ID, GE.EXPLANATION_ID;

CREATE OR REPLACE VIEW ACCESSIBLE_GROUP
AS
  SELECT  GROUP_ID AS ID,
          IMAGE, NAME, DESCRIPTION, GC.EMAIL_NOTIFY, GC.IN_APP_NOTIFY,
          USER_ID,
          GC.ID AS CONTRIBUTOR_ID,
          LEVEL
    FROM GROUP_CONTRIBUTOR AS GC
    LEFT JOIN GROUPING AS G ON GC.GROUP_ID = G.ID
  UNION
  SELECT  ID,
          IMAGE, NAME, DESCRIPTION, EMAIL_NOTIFY, IN_APP_NOTIFY,
          CREATOR_ID AS USER_ID,
          -1 AS CONTRIBUTOR_ID,
          -1 AS LEVEL
    FROM GROUPING;

-- CREATE OR REPLACE VIEW GROUP_AUTH
--   SELECT NULL AS ID, CREATOR_ID AS USER_ID, GROUP_ID, 0 AS ADMIN FROM GROUP
--   UNION
--   SELECT * FROM GroupContributor
