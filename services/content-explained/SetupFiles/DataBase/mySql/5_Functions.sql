
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
