-- SQLite

-- Table structure for table `castvote`
CREATE TABLE IF NOT EXISTS `castvote` (
  `castid` INTEGER PRIMARY KEY AUTOINCREMENT,
  `nomitationID` INTEGER,
  `voterid` INTEGER,
  `blockchaingenerated` TEXT,
  `electionid` INTEGER
);

-- Table structure for table `constituencymaster`
CREATE TABLE IF NOT EXISTS `constituencymaster` (
  `constituencyID` INTEGER PRIMARY KEY,
  `constituencyName` TEXT,
  `state` TEXT
);

-- Table structure for table `electiondetails`
CREATE TABLE IF NOT EXISTS `electiondetails` (
  `electionID` INTEGER PRIMARY KEY,
  `electionName` TEXT,
  `nominationLastDate` TEXT,
  `effDate` TEXT,
  `resultdate` TEXT,
  `status` TEXT
);

-- Table structure for table `electionnomitation`
CREATE TABLE IF NOT EXISTS `electionnomitation` (
  `nomitationID` INTEGER PRIMARY KEY,
  `voterID` INTEGER,
  `politicalPartyID` INTEGER,
  `electionID` INTEGER,
  `constituencyID` INTEGER
);

-- Table structure for table `politicalpartymaster`
CREATE TABLE IF NOT EXISTS `politicalpartymaster` (
  `politicalPartyID` INTEGER PRIMARY KEY,
  `politicalPartyName` TEXT,
  `image` TEXT
);

-- Table structure for table `votermaster`
CREATE TABLE IF NOT EXISTS `votermaster` (
  `voteID` INTEGER PRIMARY KEY,
  `title` TEXT,
  `firstName` TEXT,
  `middleName` TEXT,
  `lastName` TEXT,
  `streetName` TEXT,
  `area` TEXT,
  `city` TEXT,
  `district` TEXT,
  `state` TEXT,
  `dob` TEXT,
  `addressProof` TEXT,
  `ageProof` TEXT,
  `constituencyID` INTEGER,
  `isApproved` INTEGER,
  `mobileNbr` TEXT,
  `emailID` TEXT,
  `password` TEXT,
  `gender` TEXT,
  `Account` TEXT,
  `privatekey` TEXT
);

-- Table structure for table `admin`
CREATE TABLE IF NOT EXISTS `admin` (
  `admin_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `username` TEXT NOT NULL UNIQUE,
  `password` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SQLite3 Data

-- Data for table `constituencymaster`
INSERT INTO `constituencymaster` (`constituencyID`, `constituencyName`, `state`) VALUES
(1, 'villanur', 'puducherry');

-- Data for table `electiondetails`
INSERT INTO `electiondetails` (`electionID`, `electionName`, `nominationLastDate`, `effDate`, `resultdate`, `status`) VALUES
(1, 'mla', '2024-04-30', '2024-04-30', '2024-04-30', 'started');

-- Data for table `electionnomitation`
INSERT INTO `electionnomitation` (`nomitationID`, `voterID`, `politicalPartyID`, `electionID`, `constituencyID`) VALUES
(1, 1, 1, 1, 1);

-- Data for table `politicalpartymaster`
INSERT INTO `politicalpartymaster` (`politicalPartyID`, `politicalPartyName`, `image`) VALUES
(1, 'dmk', 'download.png');

-- Data for table `votermaster`
INSERT INTO `votermaster` (`voteID`, `title`, `firstName`, `middleName`, `lastName`, `streetName`, `area`, `city`, `district`, `state`, `dob`, `addressProof`, `ageProof`, `constituencyID`, `isApproved`, `mobileNbr`, `emailID`, `password`, `gender`, `Account`, `privatekey`) VALUES
(1, 'Mr', 'Hariharan', 'r', 'r', 'no-16 tmy complex,maraimalai adigal salai', 'pondicherry', 'pondicherry', 'pondicherry', 'Puducherry', '1991-11-12', 'Screenshot (3).png', 'Screenshot (3).png', 1, 1, '9952363956', 'hariharanrniit@gmail.com', '1212', 'Male', '0x9e4953824907162E7A4F9f047eB647acc3713E37', '0xe8f5572e9ecadb5a842f51ec97656e666585d98d589787c6573cff837ad879aa'),
(2, 'Miss', 'Hariharan', 'm', 'r', 'no-16 tmy complex,maraimalai adigal salai', 'pondichery', 'pondicherry', 'pondichery', 'Puducherry', '1995-12-01', 'download.png', 'download.png', 1, 0, '9952363956', 'hariharanrniit@gmail.com', '1234', 'Female', '', '');

-- Insert default admin credentials
INSERT INTO `admin` (username, password) VALUES ('admin@evoting.com', 'admin123');