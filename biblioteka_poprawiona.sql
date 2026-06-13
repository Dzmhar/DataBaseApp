-- =====================================================================
-- BIBLIOTEKA - poprawiona wersja bazy danych
-- MariaDB 10.4+ (XAMPP / phpMyAdmin)
--
-- Zmiany wzgledem poprzedniego eksportu:
--  [1] HASLA: kolumna Haslo przechowuje teraz skrot SHA-256 (255 znakow),
--      nigdy czystego tekstu. Docelowo aplikacja powinna haszowac
--      bcrypt/argon2 po swojej stronie - kolumna jest na to gotowa.
--  [2] PODWOJNA REZERWACJA: kolumna generowana AktywnaKsiazka + indeks
--      UNIQUE gwarantuja na poziomie bazy, ze dana ksiazka ma najwyzej
--      JEDNA aktywna rezerwacje (nawet przy rownoczesnych zapytaniach).
--      Procedura sp_zarezerwuj_ksiazke dodatkowo zwraca czytelny blad.
--  [3] BEZ ENUM: statusy zamienione na VARCHAR + CHECK (IN (...)).
--  [4] WALIDACJA FORMATOW: CHECK na e-mail, telefon, ISBN, rok wydania,
--      kolejnosc dat wypozyczenia, niepuste nazwiska/imiona/tytuly.
--  [5] PUSTE POLA OPCJONALNE = NULL: pola opcjonalne nie bedace kluczami
--      (Email, Telefon, ISBN, RokWydania, RzeczywistaDataZwrotu) sa
--      NULL-owalne, CHECK-i nie dopuszczaja pustych stringow,
--      a procedury zamieniaja '' na NULL przez NULLIF().
--  [6] Procedury wypozyczenia/zwrotu przepisane tak, by byly odporne
--      na wyscigi (atomowy UPDATE ... WHERE Status='Dostepny').
-- =====================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `biblioteka`
--

-- ---------------------------------------------------------------------
-- Tabele
-- ---------------------------------------------------------------------

CREATE TABLE `AUTORZY` (
  `IdA` int(11) NOT NULL AUTO_INCREMENT,
  `Nazwisko` varchar(50) NOT NULL,
  `Imie` varchar(50) NOT NULL,
  PRIMARY KEY (`IdA`),
  CONSTRAINT `chk_autor_nazwisko` CHECK (CHAR_LENGTH(TRIM(`Nazwisko`)) > 0),
  CONSTRAINT `chk_autor_imie`     CHECK (CHAR_LENGTH(TRIM(`Imie`)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

CREATE TABLE `KSIAZKI` (
  `IdK` int(11) NOT NULL AUTO_INCREMENT,
  `Tytul` varchar(200) NOT NULL,
  `ISBN` varchar(20) DEFAULT NULL,            -- pole opcjonalne: puste => NULL
  `RokWydania` smallint(6) DEFAULT NULL,      -- pole opcjonalne: puste => NULL
  PRIMARY KEY (`IdK`),
  UNIQUE KEY `uq_ksiazka_isbn` (`ISBN`),
  CONSTRAINT `chk_ksiazka_tytul` CHECK (CHAR_LENGTH(TRIM(`Tytul`)) > 0),
  -- ISBN: NULL albo dokladnie 10 lub 13 cyfr (myslniki dozwolone w zapisie)
  CONSTRAINT `chk_ksiazka_isbn`
    CHECK (`ISBN` IS NULL OR REPLACE(`ISBN`, '-', '') REGEXP '^[0-9]{10}$|^[0-9]{13}$'),
  CONSTRAINT `chk_ksiazka_rok`
    CHECK (`RokWydania` IS NULL OR `RokWydania` BETWEEN 1000 AND 2100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

CREATE TABLE `AUTOR_KSIAZKA` (
  `IdAK` int(11) NOT NULL AUTO_INCREMENT,
  `IdA` int(11) NOT NULL,
  `IdK` int(11) NOT NULL,
  PRIMARY KEY (`IdAK`),
  UNIQUE KEY `uq_autor_ksiazka` (`IdA`,`IdK`),
  KEY `fk_ak_ksiazka` (`IdK`),
  CONSTRAINT `fk_ak_autor`   FOREIGN KEY (`IdA`) REFERENCES `AUTORZY` (`IdA`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ak_ksiazka` FOREIGN KEY (`IdK`) REFERENCES `KSIAZKI` (`IdK`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

CREATE TABLE `BIBLIOTEKARZE` (
  `IdB` int(11) NOT NULL AUTO_INCREMENT,
  `Nazwisko` varchar(50) NOT NULL,
  `Imie` varchar(50) NOT NULL,
  `Login` varchar(50) NOT NULL,
  -- [1] przechowujemy WYLACZNIE skrot hasla (SHA-256 = 64 znaki hex);
  --     255 znakow zostawia miejsce na bcrypt/argon2 z aplikacji
  `Haslo` varchar(255) NOT NULL,
  PRIMARY KEY (`IdB`),
  UNIQUE KEY `uq_bibliotekarz_login` (`Login`),
  CONSTRAINT `chk_bib_nazwisko` CHECK (CHAR_LENGTH(TRIM(`Nazwisko`)) > 0),
  CONSTRAINT `chk_bib_imie`     CHECK (CHAR_LENGTH(TRIM(`Imie`)) > 0),
  CONSTRAINT `chk_bib_login`    CHECK (CHAR_LENGTH(TRIM(`Login`)) >= 3),
  -- zabezpieczenie przed wpisaniem hasla czystym tekstem:
  -- skrot ma zawsze >= 60 znakow (SHA-256: 64, bcrypt: 60)
  CONSTRAINT `chk_bib_haslo_hash` CHECK (CHAR_LENGTH(`Haslo`) >= 60)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

CREATE TABLE `CZYTELNICY` (
  `IdC` int(11) NOT NULL AUTO_INCREMENT,
  `Nazwisko` varchar(50) NOT NULL,
  `Imie` varchar(50) NOT NULL,
  `Email` varchar(100) DEFAULT NULL,          -- pole opcjonalne: puste => NULL
  `Telefon` varchar(20) DEFAULT NULL,         -- pole opcjonalne: puste => NULL
  `Login` varchar(50) NOT NULL,
  `Haslo` varchar(255) NOT NULL,
  PRIMARY KEY (`IdC`),
  UNIQUE KEY `uq_czytelnik_email` (`Email`),
  UNIQUE KEY `uq_czytelnik_login` (`Login`),
  CONSTRAINT `chk_czyt_nazwisko` CHECK (CHAR_LENGTH(TRIM(`Nazwisko`)) > 0),
  CONSTRAINT `chk_czyt_imie`     CHECK (CHAR_LENGTH(TRIM(`Imie`)) > 0),
  -- [4] walidacja formatu: NULL albo poprawny format (pusty string odpada)
  CONSTRAINT `chk_czyt_email`
    CHECK (`Email` IS NULL OR `Email` REGEXP '^[^@ ]+@[^@ ]+\\.[^@ ]+$'),
  CONSTRAINT `chk_czyt_telefon`
    CHECK (`Telefon` IS NULL OR `Telefon` REGEXP '^\\+?[0-9 -]{7,15}$'),
  CONSTRAINT `chk_czyt_login`    CHECK (CHAR_LENGTH(TRIM(`Login`)) >= 3),
  CONSTRAINT `chk_czyt_haslo_hash` CHECK (CHAR_LENGTH(`Haslo`) >= 60)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

CREATE TABLE `EGZEMPLARZE` (
  `IdE` int(11) NOT NULL AUTO_INCREMENT,
  `IdK` int(11) NOT NULL,
  -- [3] zamiast ENUM: VARCHAR + CHECK
  `Status` varchar(20) NOT NULL DEFAULT 'Dostepny',
  PRIMARY KEY (`IdE`),
  KEY `fk_egz_ksiazka` (`IdK`),
  CONSTRAINT `fk_egz_ksiazka` FOREIGN KEY (`IdK`) REFERENCES `KSIAZKI` (`IdK`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_egz_status`
    CHECK (`Status` IN ('Dostepny','Wypozyczony','Zarezerwowany','Wycofany'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

CREATE TABLE `REZERWACJE` (
  `IdR` int(11) NOT NULL AUTO_INCREMENT,
  `IdC` int(11) NOT NULL,
  `IdK` int(11) NOT NULL,
  `DataRezerwacji` date NOT NULL,
  -- [3] zamiast ENUM: VARCHAR + CHECK
  `StatusRezerwacji` varchar(20) NOT NULL DEFAULT 'Aktywna',
  -- [2] kolumna generowana: IdK gdy rezerwacja aktywna, inaczej NULL.
  --     UNIQUE na niej = w danej chwili tylko jedna AKTYWNA rezerwacja
  --     danej ksiazki (NULL-e sie nie powtarzaja w sensie UNIQUE).
  `AktywnaKsiazka` int(11) GENERATED ALWAYS AS
    (IF(`StatusRezerwacji` = 'Aktywna', `IdK`, NULL)) STORED,
  PRIMARY KEY (`IdR`),
  UNIQUE KEY `uq_rez_aktywna_ksiazka` (`AktywnaKsiazka`),
  KEY `fk_rez_czytelnik` (`IdC`),
  KEY `fk_rez_ksiazka` (`IdK`),
  CONSTRAINT `fk_rez_czytelnik` FOREIGN KEY (`IdC`) REFERENCES `CZYTELNICY` (`IdC`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  -- UWAGA: FK na IdK celowo bez CASCADE - InnoDB nie pozwala, by kolumna
  -- generowana (AktywnaKsiazka) zalezala od kolumny z akcja CASCADE.
  -- Efekt uboczny jest pozadany: ksiazki z historia rezerwacji nie da sie
  -- usunac "po cichu" razem z rezerwacjami.
  CONSTRAINT `fk_rez_ksiazka`   FOREIGN KEY (`IdK`) REFERENCES `KSIAZKI` (`IdK`),
  CONSTRAINT `chk_rez_status`
    CHECK (`StatusRezerwacji` IN ('Aktywna','Zrealizowana','Anulowana'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

CREATE TABLE `WYPOZYCZENIA` (
  `IdW` int(11) NOT NULL AUTO_INCREMENT,
  `IdC` int(11) NOT NULL,
  `IdE` int(11) NOT NULL,
  `IdB` int(11) NOT NULL,
  `DataWypozyczenia` date NOT NULL,
  `TerminZwrotu` date NOT NULL,
  `RzeczywistaDataZwrotu` date DEFAULT NULL,  -- NULL = jeszcze nie zwrocono
  PRIMARY KEY (`IdW`),
  KEY `fk_wyp_czytelnik` (`IdC`),
  KEY `fk_wyp_egzemplarz` (`IdE`),
  KEY `fk_wyp_bibliotekarz` (`IdB`),
  CONSTRAINT `fk_wyp_bibliotekarz` FOREIGN KEY (`IdB`) REFERENCES `BIBLIOTEKARZE` (`IdB`)
    ON UPDATE CASCADE,
  CONSTRAINT `fk_wyp_czytelnik`    FOREIGN KEY (`IdC`) REFERENCES `CZYTELNICY` (`IdC`)
    ON UPDATE CASCADE,
  CONSTRAINT `fk_wyp_egzemplarz`   FOREIGN KEY (`IdE`) REFERENCES `EGZEMPLARZE` (`IdE`)
    ON UPDATE CASCADE,
  -- [4] spojnosc dat
  CONSTRAINT `chk_wyp_termin` CHECK (`TerminZwrotu` >= `DataWypozyczenia`),
  CONSTRAINT `chk_wyp_zwrot`
    CHECK (`RzeczywistaDataZwrotu` IS NULL OR `RzeczywistaDataZwrotu` >= `DataWypozyczenia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;

-- ---------------------------------------------------------------------
-- Dane przykladowe
-- ---------------------------------------------------------------------

INSERT INTO `AUTORZY` (`IdA`, `Nazwisko`, `Imie`) VALUES
(1, 'Mickiewicz', 'Adam'),
(2, 'Sienkiewicz', 'Henryk'),
(3, 'Lem', 'Stanislaw'),
(4, 'Tokarczuk', 'Olga'),
(5, 'Sapkowski', 'Andrzej'),
(6, 'Szymborska', 'Wislawa');

INSERT INTO `KSIAZKI` (`IdK`, `Tytul`, `ISBN`, `RokWydania`) VALUES
(1, 'Pan Tadeusz', '9788373271234', 1834),
(2, 'Quo Vadis', '9788373275678', 1896),
(3, 'Solaris', '9788370548902', 1961),
(4, 'Bajki robotow', '9788308065211', 1964),
(5, 'Bieguni', '9788308051207', 2007),
(6, 'Wiedzmin: Ostatnie zyczenie', '9788375780635', 1993),
(7, 'Krew elfow', '9788375780642', 1994),
(8, 'Widok z ziarnkiem piasku', '9788308076543', 1996);

INSERT INTO `AUTOR_KSIAZKA` (`IdAK`, `IdA`, `IdK`) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 3, 3),
(4, 3, 4),
(5, 4, 5),
(6, 5, 6),
(7, 5, 7),
(8, 6, 8);

-- [1] hasla zapisywane jako SHA-256 (te same hasla testowe co wczesniej:
--     ezielinska / haslo123, kmazur / haslo456)
INSERT INTO `BIBLIOTEKARZE` (`IdB`, `Nazwisko`, `Imie`, `Login`, `Haslo`) VALUES
(1, 'Zielinska', 'Ewa', 'ezielinska', SHA2('haslo123', 256)),
(2, 'Nowak', 'Krzysztof', 'knowak', SHA2('haslo456', 256));

INSERT INTO `CZYTELNICY` (`IdC`, `Nazwisko`, `Imie`, `Email`, `Telefon`, `Login`, `Haslo`) VALUES
(1, 'Kowalski', 'Jan', 'jan.kowalski@example.com', '601234567', 'jankowalski', SHA2('czytelnik123', 256)),
(2, 'Nowak', 'Anna', 'anna.nowak@example.com', '602345678', 'annanowak', SHA2('czytelnik456', 256)),
(3, 'Wisniewski', 'Piotr', 'piotr.wisniewski@example.com', '603456789', 'piotrwisniewski', SHA2('czytelnik789', 256)),
(4, 'Wojcik', 'Maria', 'maria.wojcik@example.com', '604567890', 'mariawojcik', SHA2('czytelnik101', 256)),
(5, 'Kaminska', 'Katarzyna', 'katarzyna.kaminska@example.com', '605678901', 'katarzynakaminska', SHA2('czytelnik202', 256)),
(6, 'Lewandowski', 'Tomasz', 'tomasz.lewandowski@example.com', '606789012', 'tomaszlewandowski', SHA2('czytelnik303', 256));

INSERT INTO `EGZEMPLARZE` (`IdE`, `IdK`, `Status`) VALUES
(1, 1, 'Dostepny'),
(2, 1, 'Wypozyczony'),
(3, 2, 'Dostepny'),
(4, 3, 'Dostepny'),
(5, 3, 'Wypozyczony'),
(6, 4, 'Dostepny'),
(7, 5, 'Zarezerwowany'),
(8, 6, 'Dostepny'),
(9, 6, 'Dostepny'),
(10, 7, 'Wypozyczony'),
(11, 8, 'Dostepny');

INSERT INTO `REZERWACJE` (`IdR`, `IdC`, `IdK`, `DataRezerwacji`, `StatusRezerwacji`) VALUES
(1, 4, 5, '2026-05-25', 'Aktywna'),
(2, 5, 2, '2026-05-18', 'Zrealizowana'),
(3, 6, 3, '2026-05-30', 'Anulowana');

INSERT INTO `WYPOZYCZENIA` (`IdW`, `IdC`, `IdE`, `IdB`, `DataWypozyczenia`, `TerminZwrotu`, `RzeczywistaDataZwrotu`) VALUES
(1, 1, 2, 1, '2026-05-01', '2026-05-15', '2026-05-12'),
(2, 2, 5, 1, '2026-05-10', '2026-05-24', NULL),
(3, 3, 10, 2, '2026-05-20', '2026-06-03', NULL);

INSERT INTO `AUTORZY` (`IdA`, `Nazwisko`, `Imie`) VALUES
(7, 'Prus', 'Boleslaw'),
(8, 'Zeromski', 'Stefan'),
(9, 'Gombrowicz', 'Witold'),
(10, 'Rowling', 'J.K.');

INSERT INTO `KSIAZKI` (`IdK`, `Tytul`, `ISBN`, `RokWydania`) VALUES
(9, 'Lalka', '9788307031295', 1890),
(10, 'Faraon', '9788307031301', 1897),
(11, 'Przedwiosnie', '9788307032599', 1924),
(12, 'Silaczka', '9788307032605', 1895),
(13, 'Dzieje grzechu', '9788307032612', 1908),
(14, 'Ferdydurke', '9788307033732', 1937),
(15, 'Trans-Atlantyk', '9788307033749', 1953),
(16, 'Harry Potter i Kamien Filozoficzny', '9788373012768', 1997),
(17, 'Harry Potter i Komnata Tajemnic', '9788373012775', 1998),
(18, 'Harry Potter i Wiezien Azkabanu', '9788373012782', 1999);

INSERT INTO `AUTOR_KSIAZKA` (`IdAK`, `IdA`, `IdK`) VALUES
(9, 7, 9),
(10, 7, 10),
(11, 8, 11),
(12, 8, 12),
(13, 8, 13),
(14, 9, 14),
(15, 9, 15),
(16, 10, 16),
(17, 10, 17),
(18, 10, 18);

INSERT INTO `EGZEMPLARZE` (`IdE`, `IdK`, `Status`) VALUES
(12, 9, 'Dostepny'),
(13, 9, 'Dostepny'),
(14, 10, 'Dostepny'),
(15, 11, 'Dostepny'),
(16, 12, 'Dostepny'),
(17, 13, 'Dostepny'),
(18, 14, 'Dostepny'),
(19, 14, 'Dostepny'),
(20, 15, 'Dostepny'),
(21, 16, 'Dostepny'),
(22, 16, 'Dostepny'),
(23, 16, 'Dostepny'),
(24, 17, 'Dostepny'),
(25, 17, 'Dostepny'),
(26, 18, 'Dostepny');

-- Nowi autorzy: 20 dodatkowych ksiazek
INSERT INTO `AUTORZY` (`IdA`, `Nazwisko`, `Imie`) VALUES
(11, 'Dostojewski', 'Fiodor'),
(12, 'Szekspir', 'William'),
(13, 'Dumas', 'Aleksander'),
(14, 'Tolstoj', 'Lew'),
(15, 'Bulhakow', 'Michail'),
(16, 'Puszkin', 'Aleksander');

INSERT INTO `KSIAZKI` (`IdK`, `Tytul`, `ISBN`, `RokWydania`) VALUES
(19, 'Dziady', '9788373275777', 1823),
(20, 'Sonety krymskie', '9788373275784', 1826),
(21, 'Konrad Wallenrod', '9788373275791', 1828),
(22, 'Grazyna', '9788373275807', 1823),
(23, 'Zbrodnia i kara', '9788307033855', 1866),
(24, 'Idiota', '9788307033862', 1869),
(25, 'Bracia Karamazow', '9788307033879', 1880),
(26, 'Hamlet', '9788373275814', 1601),
(27, 'Makbet', '9788373275821', 1606),
(28, 'Romeo i Julia', '9788373275838', 1597),
(29, 'Burza', '9788373275845', 1611),
(30, 'Hrabia Monte Christo', '9788307033893', 1844),
(31, 'Trzej muszkieterowie', '9788307033909', 1844),
(32, 'Wojna i pokoj', '9788307033916', 1869),
(33, 'Anna Karenina', '9788307033923', 1877),
(34, 'Zmartwychwstanie', '9788307033930', 1899),
(35, 'Mistrz i Malgorzata', '9788307033947', 1967),
(36, 'Psie serce', '9788307033954', 1925),
(37, 'Eugeniusz Oniegin', '9788373275852', 1833),
(38, 'Dama pikowa', '9788373275869', 1834);

INSERT INTO `AUTOR_KSIAZKA` (`IdAK`, `IdA`, `IdK`) VALUES
(19, 1, 19),
(20, 1, 20),
(21, 1, 21),
(22, 1, 22),
(23, 11, 23),
(24, 11, 24),
(25, 11, 25),
(26, 12, 26),
(27, 12, 27),
(28, 12, 28),
(29, 12, 29),
(30, 13, 30),
(31, 13, 31),
(32, 14, 32),
(33, 14, 33),
(34, 14, 34),
(35, 15, 35),
(36, 15, 36),
(37, 16, 37),
(38, 16, 38);

INSERT INTO `EGZEMPLARZE` (`IdE`, `IdK`, `Status`) VALUES
(27, 19, 'Dostepny'),
(28, 19, 'Dostepny'),
(29, 20, 'Dostepny'),
(30, 21, 'Dostepny'),
(31, 22, 'Dostepny'),
(32, 23, 'Dostepny'),
(33, 24, 'Dostepny'),
(34, 25, 'Dostepny'),
(35, 25, 'Dostepny'),
(36, 26, 'Dostepny'),
(37, 26, 'Dostepny'),
(38, 27, 'Dostepny'),
(39, 28, 'Dostepny'),
(40, 29, 'Dostepny'),
(41, 30, 'Dostepny'),
(42, 30, 'Dostepny'),
(43, 31, 'Dostepny'),
(44, 31, 'Dostepny'),
(45, 32, 'Dostepny'),
(46, 32, 'Dostepny'),
(47, 33, 'Dostepny'),
(48, 34, 'Dostepny'),
(49, 35, 'Dostepny'),
(50, 35, 'Dostepny'),
(51, 36, 'Dostepny'),
(52, 37, 'Dostepny'),
(53, 38, 'Dostepny');

INSERT INTO `AUTORZY` (`IdA`, `Nazwisko`, `Imie`) VALUES
(17, 'Nabokov', 'Vladimir');

INSERT INTO `KSIAZKI` (`IdK`, `Tytul`, `ISBN`, `RokWydania`) VALUES
(39, 'Lolita', '9788307033961', 1955);

INSERT INTO `AUTOR_KSIAZKA` (`IdAK`, `IdA`, `IdK`) VALUES
(39, 17, 39);

INSERT INTO `EGZEMPLARZE` (`IdE`, `IdK`, `Status`) VALUES
(54, 39, 'Dostepny'),
(55, 39, 'Dostepny');

ALTER TABLE `AUTORZY`       AUTO_INCREMENT = 18;
ALTER TABLE `AUTOR_KSIAZKA` AUTO_INCREMENT = 40;
ALTER TABLE `BIBLIOTEKARZE` AUTO_INCREMENT = 3;
ALTER TABLE `CZYTELNICY`    AUTO_INCREMENT = 7;
ALTER TABLE `EGZEMPLARZE`   AUTO_INCREMENT = 56;
ALTER TABLE `KSIAZKI`       AUTO_INCREMENT = 40;
ALTER TABLE `REZERWACJE`    AUTO_INCREMENT = 4;
ALTER TABLE `WYPOZYCZENIA`  AUTO_INCREMENT = 4;

-- ---------------------------------------------------------------------
-- Procedury
-- ---------------------------------------------------------------------

DELIMITER $$

CREATE PROCEDURE `sp_dodaj_czytelnika` (
  IN `p_Nazwisko` VARCHAR(50), IN `p_Imie` VARCHAR(50),
  IN `p_Email` VARCHAR(100), IN `p_Telefon` VARCHAR(20),
  IN `p_Login` VARCHAR(50), IN `p_Haslo` VARCHAR(255)
)
BEGIN
    -- [5] puste pola opcjonalne zapisujemy jako NULL
    INSERT INTO `CZYTELNICY` (`Nazwisko`,`Imie`,`Email`,`Telefon`,`Login`,`Haslo`)
    VALUES (TRIM(p_Nazwisko), TRIM(p_Imie),
            NULLIF(TRIM(IFNULL(p_Email,'')), ''),
            NULLIF(TRIM(IFNULL(p_Telefon,'')), ''),
            TRIM(p_Login), SHA2(p_Haslo, 256));
    SELECT LAST_INSERT_ID() AS `IdC`;
END$$

CREATE PROCEDURE `sp_dodaj_ksiazke` (
  IN `p_Tytul` VARCHAR(200), IN `p_ISBN` VARCHAR(20), IN `p_Rok` SMALLINT
)
BEGIN
    -- [5] pusty ISBN => NULL (zamiast pustego stringa)
    INSERT INTO `KSIAZKI` (`Tytul`,`ISBN`,`RokWydania`)
    VALUES (TRIM(p_Tytul), NULLIF(TRIM(IFNULL(p_ISBN,'')), ''), p_Rok);
    SELECT LAST_INSERT_ID() AS `IdK`;
END$$

CREATE PROCEDURE `sp_dodaj_egzemplarz` (IN `p_IdK` INT)
BEGIN
    INSERT INTO `EGZEMPLARZE` (`IdK`,`Status`)
    VALUES (p_IdK, 'Dostepny');
    SELECT LAST_INSERT_ID() AS `IdE`;
END$$

CREATE PROCEDURE `sp_wypozycz_egzemplarz` (
  IN `p_IdC` INT, IN `p_IdE` INT, IN `p_IdB` INT, IN `p_DniNaZwrot` INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- [6] atomowa zmiana statusu - przy dwoch rownoczesnych wypozyczeniach
    -- tego samego egzemplarza tylko jedno przejdzie (ROW_COUNT() = 1)
    UPDATE `EGZEMPLARZE`
       SET `Status` = 'Wypozyczony'
     WHERE `IdE` = p_IdE AND `Status` = 'Dostepny';

    IF ROW_COUNT() = 0 THEN
        IF NOT EXISTS (SELECT 1 FROM `EGZEMPLARZE` WHERE `IdE` = p_IdE) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Egzemplarz nie istnieje';
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Egzemplarz nie jest dostepny';
        END IF;
    END IF;

    INSERT INTO `WYPOZYCZENIA`
        (`IdC`,`IdE`,`IdB`,`DataWypozyczenia`,`TerminZwrotu`)
    VALUES
        (p_IdC, p_IdE, p_IdB, CURDATE(),
         DATE_ADD(CURDATE(), INTERVAL IFNULL(p_DniNaZwrot,14) DAY));

    -- Realize active reservation if exists
    UPDATE `REZERWACJE`
       SET `StatusRezerwacji` = 'Zrealizowana'
     WHERE `IdC` = p_IdC
       AND `IdK` = (SELECT `IdK` FROM `EGZEMPLARZE` WHERE `IdE` = p_IdE)
       AND `StatusRezerwacji` = 'Aktywna';

    COMMIT;
    SELECT LAST_INSERT_ID() AS `IdW`;
END$$

CREATE PROCEDURE `sp_zwrot_egzemplarza` (IN `p_IdW` INT)
BEGIN
    DECLARE v_idE INT;
    DECLARE v_zwrocono DATE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT `IdE`, `RzeczywistaDataZwrotu` INTO v_idE, v_zwrocono
      FROM `WYPOZYCZENIA` WHERE `IdW` = p_IdW FOR UPDATE;

    IF v_idE IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Wypozyczenie nie istnieje';
    ELSEIF v_zwrocono IS NOT NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Egzemplarz zostal juz zwrocony';
    END IF;

    UPDATE `WYPOZYCZENIA`
       SET `RzeczywistaDataZwrotu` = CURDATE()
     WHERE `IdW` = p_IdW;

    UPDATE `EGZEMPLARZE` SET `Status` = 'Dostepny' WHERE `IdE` = v_idE;

    COMMIT;
END$$

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

    INSERT INTO `REZERWACJE` (`IdC`,`IdK`,`DataRezerwacji`,`StatusRezerwacji`)
    VALUES (p_IdC, p_IdK, CURDATE(), 'Aktywna');

    -- Mark first available copy as reserved
    UPDATE `EGZEMPLARZE` SET `Status` = 'Zarezerwowany'
     WHERE `IdK` = p_IdK AND `Status` = 'Dostepny'
     LIMIT 1;

    COMMIT;
    SELECT LAST_INSERT_ID() AS `IdR`;
END$$

CREATE PROCEDURE `sp_anuluj_rezerwacje` (IN `p_IdR` INT)
BEGIN
    DECLARE v_IdK INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT `IdK` INTO v_IdK FROM `REZERWACJE` WHERE `IdR` = p_IdR;

    IF v_IdK IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rezerwacja nie istnieje';
    END IF;

    -- Reset copy status to available
    UPDATE `EGZEMPLARZE` SET `Status` = 'Dostepny'
     WHERE `IdK` = v_IdK AND `Status` = 'Zarezerwowany';

    UPDATE `REZERWACJE`
       SET `StatusRezerwacji` = 'Anulowana'
     WHERE `IdR` = p_IdR;

    COMMIT;
END$$

-- TRA/010: Edycja danych czytelnika
CREATE PROCEDURE `sp_edytuj_czytelnika` (
  IN `p_IdC` INT, IN `p_Nazwisko` VARCHAR(50), IN `p_Imie` VARCHAR(50),
  IN `p_Email` VARCHAR(100), IN `p_Telefon` VARCHAR(20),
  IN `p_Login` VARCHAR(50), IN `p_Haslo` VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM `CZYTELNICY` WHERE `IdC` = p_IdC) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Czytelnik nie istnieje';
    END IF;
    UPDATE `CZYTELNICY`
       SET `Nazwisko` = TRIM(p_Nazwisko),
           `Imie`     = TRIM(p_Imie),
           `Email`    = NULLIF(TRIM(IFNULL(p_Email,'')), ''),
           `Telefon`  = NULLIF(TRIM(IFNULL(p_Telefon,'')), ''),
           `Login`    = TRIM(p_Login),
           `Haslo`    = CASE WHEN TRIM(p_Haslo) = '' THEN `Haslo` ELSE SHA2(TRIM(p_Haslo), 256) END
     WHERE `IdC` = p_IdC;
END$$

-- TRA/011: Usuniecie czytelnika
-- (czytelnika z historia wypozyczen nie usuwamy - FK i tak by to
--  zablokowal, procedura zwraca czytelny komunikat; rezerwacje
--  usuwaja sie kaskadowo)
CREATE PROCEDURE `sp_usun_czytelnika` (IN `p_IdC` INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM `CZYTELNICY` WHERE `IdC` = p_IdC) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Czytelnik nie istnieje';
    END IF;
    IF EXISTS (SELECT 1 FROM `WYPOZYCZENIA` WHERE `IdC` = p_IdC) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nie mozna usunac czytelnika z historia wypozyczen';
    END IF;
    DELETE FROM `CZYTELNICY` WHERE `IdC` = p_IdC;
END$$

-- TRA/012: Edycja danych ksiazki
CREATE PROCEDURE `sp_edytuj_ksiazke` (
  IN `p_IdK` INT, IN `p_Tytul` VARCHAR(200),
  IN `p_ISBN` VARCHAR(20), IN `p_Rok` SMALLINT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM `KSIAZKI` WHERE `IdK` = p_IdK) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ksiazka nie istnieje';
    END IF;
    UPDATE `KSIAZKI`
       SET `Tytul`      = TRIM(p_Tytul),
           `ISBN`       = NULLIF(TRIM(IFNULL(p_ISBN,'')), ''),
           `RokWydania` = p_Rok
     WHERE `IdK` = p_IdK;
END$$

-- TRA/013: Wyszukiwanie czytelnika (po fragmencie nazwiska/imienia/emaila)
 CREATE PROCEDURE `sp_szukaj_czytelnika` (IN `p_Fraza` VARCHAR(100))
 BEGIN
     SELECT `IdC`, `Nazwisko`, `Imie`, `Email`, `Telefon`
       FROM `CZYTELNICY`
      WHERE `Nazwisko` LIKE CONCAT('%', p_Fraza, '%') COLLATE utf8mb4_polish_ci
         OR `Imie`     LIKE CONCAT('%', p_Fraza, '%') COLLATE utf8mb4_polish_ci
         OR `Email`    LIKE CONCAT('%', p_Fraza, '%') COLLATE utf8mb4_polish_ci
      ORDER BY `Nazwisko`, `Imie`;
 END$$

-- TRA/014: Historia wypozyczen czytelnika
CREATE PROCEDURE `sp_historia_wypozyczen` (IN `p_IdC` INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM `CZYTELNICY` WHERE `IdC` = p_IdC) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Czytelnik nie istnieje';
    END IF;
    SELECT `w`.`IdW`,
           `k`.`Tytul`,
           `w`.`IdE` AS `NrEgzemplarza`,
           `w`.`DataWypozyczenia`,
           `w`.`TerminZwrotu`,
           `w`.`RzeczywistaDataZwrotu`,
           CASE WHEN `w`.`RzeczywistaDataZwrotu` IS NOT NULL THEN 'Zwrocona'
                WHEN `w`.`TerminZwrotu` < CURDATE() THEN 'Po terminie'
                ELSE 'W trakcie'
           END AS `Status`
      FROM `WYPOZYCZENIA` `w`
      JOIN `EGZEMPLARZE` `e` ON `e`.`IdE` = `w`.`IdE`
      JOIN `KSIAZKI` `k`     ON `k`.`IdK` = `e`.`IdK`
     WHERE `w`.`IdC` = p_IdC
     ORDER BY `w`.`DataWypozyczenia` DESC;
END$$

DELIMITER ;

-- ---------------------------------------------------------------------
-- Widoki
-- ---------------------------------------------------------------------

CREATE OR REPLACE VIEW `v_wyszukiwanie_ksiazek` AS
SELECT `k`.`IdK` AS `IdK`,
       `k`.`Tytul` AS `Tytul`,
       `k`.`ISBN` AS `ISBN`,
       `k`.`RokWydania` AS `RokWydania`,
       GROUP_CONCAT(DISTINCT CONCAT(`a`.`Imie`,' ',`a`.`Nazwisko`)
                    ORDER BY `a`.`Nazwisko` ASC SEPARATOR ', ') AS `Autorzy`,
       COUNT(DISTINCT `e`.`IdE`) AS `LiczbaEgzemplarzy`,
       SUM(CASE WHEN `e`.`Status` = 'Dostepny' THEN 1 ELSE 0 END) AS `LiczbaDostepnych`
FROM `KSIAZKI` `k`
LEFT JOIN `AUTOR_KSIAZKA` `ak` ON `ak`.`IdK` = `k`.`IdK`
LEFT JOIN `AUTORZY` `a`        ON `a`.`IdA` = `ak`.`IdA`
LEFT JOIN `EGZEMPLARZE` `e`    ON `e`.`IdK` = `k`.`IdK`
GROUP BY `k`.`IdK`, `k`.`Tytul`, `k`.`ISBN`, `k`.`RokWydania`;

CREATE OR REPLACE VIEW `v_zestawienie_wypozyczen` AS
SELECT `w`.`IdW` AS `IdW`,
       CONCAT(`c`.`Imie`,' ',`c`.`Nazwisko`) AS `Czytelnik`,
       `k`.`Tytul` AS `Tytul`,
       `w`.`IdE` AS `NrEgzemplarza`,
       CONCAT(`b`.`Imie`,' ',`b`.`Nazwisko`) AS `Bibliotekarz`,
       `w`.`DataWypozyczenia` AS `DataWypozyczenia`,
       `w`.`TerminZwrotu` AS `TerminZwrotu`,
       `w`.`RzeczywistaDataZwrotu` AS `RzeczywistaDataZwrotu`,
       CASE WHEN `w`.`RzeczywistaDataZwrotu` IS NOT NULL THEN 'Zwrocona'
            WHEN `w`.`TerminZwrotu` < CURDATE() THEN 'Po terminie'
            ELSE 'W trakcie'
       END AS `Status`
FROM `WYPOZYCZENIA` `w`
JOIN `CZYTELNICY` `c`   ON `c`.`IdC` = `w`.`IdC`
JOIN `EGZEMPLARZE` `e`  ON `e`.`IdE` = `w`.`IdE`
JOIN `KSIAZKI` `k`      ON `k`.`IdK` = `e`.`IdK`
JOIN `BIBLIOTEKARZE` `b` ON `b`.`IdB` = `w`.`IdB`;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
