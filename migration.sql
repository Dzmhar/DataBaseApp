DROP PROCEDURE IF EXISTS `sp_zarezerwuj_ksiazke`;
DELIMITER $$
CREATE PROCEDURE `sp_zarezerwuj_ksiazke` (IN `p_IdC` INT, IN `p_IdK` INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    DECLARE EXIT HANDLER FOR 1062
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ksiazka ma juz aktywna rezerwacje innego czytelnika';
    END;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM `KSIAZKI` WHERE `IdK` = p_IdK) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ksiazka nie istnieje';
    END IF;

    IF EXISTS (SELECT 1 FROM `REZERWACJE`
                WHERE `IdK` = p_IdK AND `StatusRezerwacji` = 'Aktywna') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ksiazka ma juz aktywna rezerwacje innego czytelnika';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM `EGZEMPLARZE` WHERE `IdK` = p_IdK AND `Status` = 'Dostepny') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Brak dostepnych egzemplarzy do rezerwacji';
    END IF;

    INSERT INTO `REZERWACJE` (`IdC`,`IdK`,`DataRezerwacji`,`StatusRezerwacji`)
    VALUES (p_IdC, p_IdK, CURDATE(), 'Aktywna');

    -- Mark first available copy as reserved
    UPDATE `EGZEMPLARZE` SET `Status` = 'Zarezerwowany'
     WHERE `IdK` = p_IdK AND `Status` = 'Dostepny'
     LIMIT 1;

    COMMIT;
    SELECT LAST_INSERT_ID() AS `IdR`;
END$$
DELIMITER ;
