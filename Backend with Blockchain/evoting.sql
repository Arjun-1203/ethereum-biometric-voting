-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 01, 2024 at 06:32 AM
-- Server version: 10.4.24-MariaDB
-- PHP Version: 7.4.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `evoting`
--

-- --------------------------------------------------------

--
-- Table structure for table `castvote`
--

CREATE TABLE `castvote` (
  `castid` int(11) DEFAULT NULL,
  `nomitationID` int(11) DEFAULT NULL,
  `voterid` int(11) DEFAULT NULL,
  `blockchaingenerated` varchar(1000) DEFAULT NULL,
  `electionid` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `constituencymaster`
--

CREATE TABLE `constituencymaster` (
  `constituencyID` int(11) DEFAULT NULL,
  `constituencyName` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `constituencymaster`
--

INSERT INTO `constituencymaster` (`constituencyID`, `constituencyName`, `state`) VALUES
(1, 'villanur', 'puducherry');

-- --------------------------------------------------------

--
-- Table structure for table `electiondetails`
--

CREATE TABLE `electiondetails` (
  `electionID` int(11) DEFAULT NULL,
  `electionName` varchar(100) DEFAULT NULL,
  `nominationLastDate` date DEFAULT NULL,
  `effDate` date DEFAULT NULL,
  `resultdate` date DEFAULT NULL,
  `status` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `electiondetails`
--

INSERT INTO `electiondetails` (`electionID`, `electionName`, `nominationLastDate`, `effDate`, `resultdate`, `status`) VALUES
(1, 'mla', '2024-04-30', '2024-04-30', '2024-04-30', 'started');

-- --------------------------------------------------------

--
-- Table structure for table `electionnomitation`
--

CREATE TABLE `electionnomitation` (
  `nomitationID` int(11) DEFAULT NULL,
  `voterID` int(11) DEFAULT NULL,
  `politicalPartyID` int(11) DEFAULT NULL,
  `electionID` int(11) DEFAULT NULL,
  `constituencyID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `electionnomitation`
--

INSERT INTO `electionnomitation` (`nomitationID`, `voterID`, `politicalPartyID`, `electionID`, `constituencyID`) VALUES
(1, 1, 1, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `politicalpartymaster`
--

CREATE TABLE `politicalpartymaster` (
  `politicalPartyID` int(11) DEFAULT NULL,
  `politicalPartyName` varchar(100) DEFAULT NULL,
  `image` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `politicalpartymaster`
--

INSERT INTO `politicalpartymaster` (`politicalPartyID`, `politicalPartyName`, `image`) VALUES
(1, 'dmk', 'download.png');

-- --------------------------------------------------------

--
-- Table structure for table `votermaster`
--

CREATE TABLE `votermaster` (
  `voteID` int(11) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `firstName` varchar(100) DEFAULT NULL,
  `middleName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) DEFAULT NULL,
  `streetName` varchar(100) DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `dob` varchar(100) DEFAULT NULL,
  `addressProof` varchar(100) DEFAULT NULL,
  `ageProof` varchar(100) DEFAULT NULL,
  `constituencyID` int(11) DEFAULT NULL,
  `isApproved` int(11) DEFAULT NULL,
  `mobileNbr` varchar(100) DEFAULT NULL,
  `emailID` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `gender` varchar(100) DEFAULT NULL,
  `Account` varchar(100) DEFAULT NULL,
  `privatekey` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `votermaster`
--

INSERT INTO `votermaster` (`voteID`, `title`, `firstName`, `middleName`, `lastName`, `streetName`, `area`, `city`, `district`, `state`, `dob`, `addressProof`, `ageProof`, `constituencyID`, `isApproved`, `mobileNbr`, `emailID`, `password`, `gender`, `Account`, `privatekey`) VALUES
(1, 'Mr', 'Hariharan', 'r', 'r', 'no-16 tmy complex,maraimalai adigal salai', 'pondicherry', 'pondicherry', 'pondicherry', 'Puducherry', '1991-11-12', 'Screenshot (3).png', 'Screenshot (3).png', 1, 1, '9952363956', 'hariharanrniit@gmail.com', '1212', 'Male', '0x9e4953824907162E7A4F9f047eB647acc3713E37', '0xe8f5572e9ecadb5a842f51ec97656e666585d98d589787c6573cff837ad879aa'),
(2, 'Miss', 'Hariharan', 'm', 'r', 'no-16 tmy complex,maraimalai adigal salai', 'pondichery', 'pondicherry', 'pondichery', 'Puducherry', '1995-12-01', 'download.png', 'download.png', 1, 0, '9952363956', 'hariharanrniit@gmail.com', '1234', 'Female', '', '');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
