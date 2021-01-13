
-- ==========================  Views  =====================--

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
      LEFT JOIN SITE ON SITE.ID = SITE_EXPLANATION.SITE_ID;


CREATE OR REPLACE VIEW EXPLANATION_CONNECTIONS
AS
  SELECT ROW_INDEX() AS ID,
                  EXPLANATION_ID,
                  AUTHOR_ID AS COMMENTOR_ID,
                  SITE_ID AS COMMENT_SITE_ID,
                  ASKER_ID,
                  QUESTION_ID,
                  QUESTION_SITE_ID
  FROM COMMENT AS COM
    JOIN (SELECT ID AS EXPL_ID,
                 WORDS_ID
    FROM EXPLANATION) AS EXPL
      ON COM.EXPLANATION_ID = EXPL.EXPL_ID
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
