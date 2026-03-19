-- MySQL dump 10.13  Distrib 9.6.0, for macos14.8 (x86_64)
--
-- Host: localhost    Database: hr_employee_db
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '205dc55c-197c-11f1-80d0-c7e218cec262:1-210';

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `details` text,
  `timestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (8,7,'UPDATE_APPLICATION','Application #1 status → Rejected','2026-03-09 17:21:59'),(9,7,'SCHEDULE_INTERVIEW','Interview for #2 on 2026-03-10T17:22','2026-03-09 17:22:27'),(10,7,'CHECK_IN','User Super Admin checked in at 17:26:24.813220','2026-03-09 17:26:25'),(11,7,'CHECK_OUT','User Super Admin checked out at 17:26:28.364435','2026-03-09 17:26:28'),(12,7,'UPDATE_APPLICATION','Application #1 status → Rejected','2026-03-10 16:14:59'),(13,7,'UPDATE_APPLICATION','Application #1 status → Approved','2026-03-10 16:20:24'),(14,7,'UPDATE_APPLICATION','Application #3 status → Rejected','2026-03-10 16:28:04'),(15,7,'UPDATE_APPLICATION','Application #3 status → Rejected','2026-03-10 16:28:04'),(16,7,'UPDATE_APPLICATION','Application #3 status → Rejected','2026-03-10 16:28:05'),(17,7,'UPDATE_APPLICATION','Application #3 status → Rejected','2026-03-10 16:28:05'),(18,7,'UPDATE_APPLICATION','Application #3 status → Rejected','2026-03-10 16:28:06'),(19,7,'UPDATE_APPLICATION','Application #3 status → Rejected','2026-03-10 16:28:07'),(20,7,'UPDATE_APPLICATION','Application #4 status → Rejected','2026-03-10 16:31:10'),(21,7,'SCHEDULE_INTERVIEW','Interview for #5 on 2026-03-03T16:33','2026-03-10 16:33:28'),(22,7,'UPDATE_APPLICATION','Application #5 status → Approved','2026-03-10 16:33:40'),(23,7,'SCHEDULE_INTERVIEW','Interview for #7 on 2026-03-13T08:30','2026-03-10 16:46:11'),(24,7,'UPDATE_APPLICATION','Application #7 status → Approved','2026-03-10 16:46:52'),(25,7,'ADD_VOLUNTEER','Added Volunteer: Joshwa','2026-03-10 16:55:31'),(26,7,'ADD_EMPLOYEE','Added Employee & User: Joshwa','2026-03-10 16:56:36'),(27,7,'CHECK_IN','User Super Admin checked in at 16:57:38.265655','2026-03-10 16:57:38'),(28,7,'ADD_HR','Created HR user: Joshwa','2026-03-10 17:00:25'),(29,7,'SCHEDULE_INTERVIEW','Interview for #8 on 2026-03-12T17:04','2026-03-10 17:04:55'),(30,7,'UPDATE_APPLICATION','Application #8 status → Rejected','2026-03-10 17:05:51'),(31,7,'UPDATE_APPLICATION','Application #8 status → Rejected','2026-03-10 17:06:01'),(32,7,'UPDATE_APPLICATION','Application #8 status → Rejected','2026-03-10 17:06:04'),(33,7,'UPDATE_APPLICATION','Application #8 status → Rejected','2026-03-10 17:06:07'),(34,7,'UPDATE_APPLICATION','Application #8 status → Rejected','2026-03-10 17:06:09'),(35,7,'UPDATE_APPLICATION','Application #8 status → Rejected','2026-03-10 17:06:10'),(36,7,'UPDATE_APPLICATION','Application #8 status → Rejected','2026-03-10 17:06:13'),(37,7,'CHECK_IN','User Super Admin checked in at 17:24:37.371903','2026-03-11 17:24:37'),(38,7,'CHECK_OUT','User Super Admin checked out at 17:24:38.319274','2026-03-11 17:24:38'),(39,7,'ADD_HR','Created HR user: Joshwa','2026-03-11 17:31:21'),(40,14,'ADD_VOLUNTEER','Added Volunteer: Joshwa','2026-03-11 17:32:54'),(41,7,'DELETE_VOLUNTEER','Deleted Volunteer: Joshwa','2026-03-11 17:34:07'),(42,7,'ADD_VOLUNTEER','Added Volunteer: Joshwa','2026-03-11 17:34:20'),(43,7,'DELETE_VOLUNTEER','Deleted Volunteer: Joshwa','2026-03-11 17:35:01'),(44,7,'DELETE_EMPLOYEE','Deleted Employee: Joshwa','2026-03-11 17:35:06'),(45,14,'CHECK_IN','Auto check-in on login','2026-03-13 16:50:14'),(46,14,'ADD_DONOR','Added Donor: Joshwa, Amount: 0','2026-03-13 16:52:12'),(47,14,'ADD_DONOR','Added Donor: Josh, Amount: 10000','2026-03-13 17:12:19'),(48,14,'UPDATE_DONOR','Updated Donor: Josh','2026-03-13 17:12:33'),(49,14,'ADD_VOLUNTEER','Added Volunteer: Ajay M','2026-03-13 17:13:27'),(50,14,'ADD_DONOR','Added Donor: Josh, Amount: 10000','2026-03-13 17:24:10'),(51,19,'CHECK_IN','Auto check-in on login','2026-03-13 17:27:34'),(52,14,'CHECK_OUT','Auto check-out on logout','2026-03-13 17:28:27'),(53,7,'CHECK_IN','Auto check-in on login','2026-03-13 17:28:32');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_type` varchar(20) NOT NULL,
  `status` varchar(30) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `id_proof_type` varchar(50) DEFAULT NULL,
  `id_proof_number` varchar(50) DEFAULT NULL,
  `education` varchar(255) DEFAULT NULL,
  `work_experience` text,
  `previous_ngo_experience` text,
  `skills` varchar(255) DEFAULT NULL,
  `availability` varchar(100) DEFAULT NULL,
  `donation_capacity` varchar(100) DEFAULT NULL,
  `reference_name` varchar(100) DEFAULT NULL,
  `reference_contact` varchar(100) DEFAULT NULL,
  `criminal_record` varchar(10) DEFAULT NULL,
  `criminal_details` text,
  `is_christian` varchar(10) DEFAULT NULL,
  `years_as_believer` int DEFAULT NULL,
  `church_name` varchar(150) DEFAULT NULL,
  `church_location` varchar(150) DEFAULT NULL,
  `pastor_name` varchar(100) DEFAULT NULL,
  `pastor_contact` varchar(100) DEFAULT NULL,
  `spiritual_gifts` varchar(255) DEFAULT NULL,
  `ministry_involvement` text,
  `personal_testimony` text,
  `reason_to_join` text,
  `agrees_to_statement` tinyint(1) DEFAULT NULL,
  `interview_date` datetime DEFAULT NULL,
  `interview_notes` text,
  `reviewed_by` int DEFAULT NULL,
  `rejection_reason` text,
  `photo_filename` varchar(255) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (3,7,'2026-03-09','Present','17:26:25','17:26:28'),(4,7,'2026-03-10','Present','16:57:38',NULL),(5,7,'2026-03-11','Present','17:24:37','17:24:38'),(6,14,'2026-03-13','Present','16:50:14','17:28:27'),(7,19,'2026-03-13','Present','17:27:34',NULL),(8,7,'2026-03-13','Present','17:28:32',NULL);
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `beneficiaries`
--

DROP TABLE IF EXISTS `beneficiaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `beneficiaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `needs` text,
  `status` varchar(50) DEFAULT NULL,
  `assigned_volunteer_id` int DEFAULT NULL,
  `photo_filename` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assigned_volunteer_id` (`assigned_volunteer_id`),
  CONSTRAINT `beneficiaries_ibfk_1` FOREIGN KEY (`assigned_volunteer_id`) REFERENCES `volunteers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `beneficiaries`
--

LOCK TABLES `beneficiaries` WRITE;
/*!40000 ALTER TABLE `beneficiaries` DISABLE KEYS */;
INSERT INTO `beneficiaries` VALUES (1,'Ben Eficiary',NULL,NULL,25,'Male','Food, Shelter','Pending',NULL,NULL,'2026-03-06 17:12:54'),(2,'Joshwa','joshwan93@gmail.com','9342204911',25,'Male','Food & Nutrition\nSituation: amen','Pending',NULL,NULL,'2026-03-10 17:27:02');
/*!40000 ALTER TABLE `beneficiaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deliverables`
--

DROP TABLE IF EXISTS `deliverables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deliverables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `deliverables_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliverables`
--

LOCK TABLES `deliverables` WRITE;
/*!40000 ALTER TABLE `deliverables` DISABLE KEYS */;
/*!40000 ALTER TABLE `deliverables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `donors`
--

DROP TABLE IF EXISTS `donors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `donation_amount` float DEFAULT NULL,
  `last_donation_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `donors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `donors`
--

LOCK TABLES `donors` WRITE;
/*!40000 ALTER TABLE `donors` DISABLE KEYS */;
INSERT INTO `donors` VALUES (5,'Josh','joshwa@piltismart.org','','',10000,NULL,'2026-03-13 17:24:10',NULL);
/*!40000 ALTER TABLE `donors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `age` int DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `sponsor` varchar(100) DEFAULT NULL,
  `hr_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `hr_id` (`hr_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`hr_id`) REFERENCES `users` (`id`),
  CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leaves`
--

DROP TABLE IF EXISTS `leaves`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leaves` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `leaves_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leaves`
--

LOCK TABLES `leaves` WRITE;
/*!40000 ALTER TABLE `leaves` DISABLE KEYS */;
/*!40000 ALTER TABLE `leaves` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_verifications`
--

DROP TABLE IF EXISTS `otp_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone_number` varchar(20) NOT NULL,
  `otp_hash` varchar(64) NOT NULL,
  `expiry_time` datetime NOT NULL,
  `attempts` int DEFAULT NULL,
  `verified` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_otp_verifications_phone_number` (`phone_number`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_verifications`
--

LOCK TABLES `otp_verifications` WRITE;
/*!40000 ALTER TABLE `otp_verifications` DISABLE KEYS */;
INSERT INTO `otp_verifications` VALUES (1,'9000000001','baabe004ce3d068ea9f92aa5e23caaa51c91e31fc9383da93aa2df764bc38d1e','2026-03-09 15:06:50',0,0,'2026-03-09 15:01:51'),(2,'9876543210','c23d4cc7cb75d82468fa026343f63688beed870d408cf139dc3b95188b7ae43a','2026-03-09 15:07:56',0,0,'2026-03-09 15:02:56'),(3,'9342204911','28c7b0381d82116870dc073807364091061bbafd1eff7b5ba3e130b5caba9690','2026-03-09 16:03:19',0,0,'2026-03-09 15:58:19');
/*!40000 ALTER TABLE `otp_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `budget` float DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `generated_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `generated_by` (`generated_by`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin',NULL),(2,'HR',NULL),(3,'Employee',NULL),(4,'Donor',NULL),(5,'Volunteer',NULL),(6,'Beneficiary',NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spiritual_growth`
--

DROP TABLE IF EXISTS `spiritual_growth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spiritual_growth` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `date` date DEFAULT NULL,
  `activity_type` varchar(100) NOT NULL,
  `duration` int DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `spiritual_growth_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spiritual_growth`
--

LOCK TABLES `spiritual_growth` WRITE;
/*!40000 ALTER TABLE `spiritual_growth` DISABLE KEYS */;
/*!40000 ALTER TABLE `spiritual_growth` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sponsorships`
--

DROP TABLE IF EXISTS `sponsorships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sponsorships` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sponsor_name` varchar(100) NOT NULL,
  `amount` float NOT NULL,
  `date` datetime DEFAULT NULL,
  `donor_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `donor_id` (`donor_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `sponsorships_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`id`),
  CONSTRAINT `sponsorships_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sponsorships`
--

LOCK TABLES `sponsorships` WRITE;
/*!40000 ALTER TABLE `sponsorships` DISABLE KEYS */;
/*!40000 ALTER TABLE `sponsorships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (7,'Super Admin','shan@gmail.com','scrypt:32768:8:1$K7NGPLEMYd2Ic2X8$eb0fd584113b3ebafbe8756e823d2cbc83d0ba070d58ff7ceb0ad475a6e07c77c98af666adfade9049e6300d4d85af505b2cc61daf8cfe5e06b4d220ace0fb83',1,'2026-03-09 16:50:13'),(14,'Joshwa','joshwan93@gmail.com','scrypt:32768:8:1$kxfHrY5SwNSrgz1i$89abdf00e2ce4fb2b5f7f66a6532f5a5f7ae74ed17c8959a04d4cca3ebb6d6fbfc5520a1e9c5f825759b16fdab1b68b987fcb4b3e90021a61017f501459816ce',2,'2026-03-11 17:31:17'),(15,'Joshwa','joshwan@piltismart.org','scrypt:32768:8:1$besnTDXBpWidZ2zb$e6e04564517bf7a67df257d0eb3794700f1646b5fed7abf21199aa95e6e18af25b7a91665ba2bf174eb2b8aa972806cf2f4434343af19b368413dc6de153564d',4,'2026-03-13 16:52:08'),(17,'Josh','joshwa@piltismart.oorg','scrypt:32768:8:1$h33eYlhQ4UOh7Po1$35e8350a92bc654bda44e68c2ec7a5332d0b5602e2117a866f0bc2d7d82a692ed7f40aca861ba6ca9757c55a4c8c9ec928e36e5475adc163ebcbac0ca807519f',4,'2026-03-13 17:12:15'),(19,'Josh','joshwa@piltismart.org','scrypt:32768:8:1$kqOJ5OWbsWhCcgPM$2eb4bc96693b68ac6e2c287affc3218aa9571e3986d38a73c29fbff7618abee38d695a9a0dc2bc91a676010c216a19a747af6c2c9612d245e8076a6091cbdad0',4,'2026-03-13 17:24:05');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `volunteers`
--

DROP TABLE IF EXISTS `volunteers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `volunteers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `skills` varchar(255) DEFAULT NULL,
  `availability` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `volunteers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `volunteers`
--

LOCK TABLES `volunteers` WRITE;
/*!40000 ALTER TABLE `volunteers` DISABLE KEYS */;
/*!40000 ALTER TABLE `volunteers` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-17 15:57:51
