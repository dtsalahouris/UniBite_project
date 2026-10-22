-- MySQL dump 10.13  Distrib 9.6.0, for macos26.4 (arm64)
--
-- Host: localhost    Database: unibite
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

--
-- Current Database: `unibite`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `unibite` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `unibite`;

--
-- Table structure for table `allergens`
--

DROP TABLE IF EXISTS `allergens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allergens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `allergens`
--

LOCK TABLES `allergens` WRITE;
/*!40000 ALTER TABLE `allergens` DISABLE KEYS */;
INSERT INTO `allergens` VALUES (9,'Celery'),(7,'Crustaceans'),(3,'Eggs'),(6,'Fish'),(1,'Gluten'),(13,'Lupin'),(2,'Milk'),(14,'Molluscs'),(10,'Mustard'),(4,'Peanuts'),(11,'Sesame'),(5,'Soy'),(12,'Sulphites'),(8,'Tree Nuts');
/*!40000 ALTER TABLE `allergens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meal_allergens`
--

DROP TABLE IF EXISTS `meal_allergens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meal_allergens` (
  `meal_id` int NOT NULL,
  `allergen_id` int NOT NULL,
  PRIMARY KEY (`meal_id`,`allergen_id`),
  KEY `allergen_id` (`allergen_id`),
  CONSTRAINT `meal_allergens_ibfk_1` FOREIGN KEY (`meal_id`) REFERENCES `meals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `meal_allergens_ibfk_2` FOREIGN KEY (`allergen_id`) REFERENCES `allergens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meal_allergens`
--

LOCK TABLES `meal_allergens` WRITE;
/*!40000 ALTER TABLE `meal_allergens` DISABLE KEYS */;
INSERT INTO `meal_allergens` VALUES (1,1),(2,1),(3,1),(4,1),(1,2),(3,2),(4,2),(3,3),(4,3),(5,3),(5,5),(5,9),(5,12);
/*!40000 ALTER TABLE `meal_allergens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meals`
--

DROP TABLE IF EXISTS `meals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cook_id` int NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `portions_total` int NOT NULL,
  `portions_available` int NOT NULL,
  `pickup_location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pickup_time` datetime NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cook_id` (`cook_id`),
  CONSTRAINT `meals_ibfk_1` FOREIGN KEY (`cook_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meals`
--

LOCK TABLES `meals` WRITE;
/*!40000 ALTER TABLE `meals` DISABLE KEYS */;
INSERT INTO `meals` VALUES (1,1,'Pastitsio','images/pastitsio.jpg','Homemade food, contains bechamel and minced meat.',4,2,'Student Dorm A,Room 12','2026-04-15 14:00:00',38.2466000,21.7346000,'2026-06-02 12:53:20',NULL),(2,3,'Lentil Soup','images/fakes.jpg','Freshly cooked, ideal for lunch.',5,4,'Engineering School Entrance','2026-04-15 13:30:00',38.2500000,21.7400000,'2026-06-02 12:53:20',NULL),(3,1,'Cheese Pie','images/tiropita.jpg','Baked this morning,very tasty.',3,0,'Library Building','2026-04-15 11:30:00',38.2480000,21.7355000,'2026-06-02 12:53:20',NULL),(4,1,'Pasta and meatballs','uploads/1780394283091.jpeg','Pasta, cheese, meatballs, tomato sauce, salt, pepper, oliveoil',9,8,'Karaiskaki 32, Patras','2026-08-07 12:45:00',38.2983540,21.7853088,'2026-06-02 12:58:03',NULL),(5,3,'egg fried rice','uploads/1780394798818.jpeg','rice, egges, olive oil, celery, soy souce',7,7,'Korinthou 57, Patras','2026-09-07 16:05:00',38.2512860,21.7422423,'2026-06-02 13:06:38','2026-06-02 13:08:21');
/*!40000 ALTER TABLE `meals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `point_transactions`
--

DROP TABLE IF EXISTS `point_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `point_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `request_id` int DEFAULT NULL,
  `change_amount` int NOT NULL,
  `reason` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `request_id` (`request_id`),
  CONSTRAINT `point_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `point_transactions_ibfk_2` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `point_transactions`
--

LOCK TABLES `point_transactions` WRITE;
/*!40000 ALTER TABLE `point_transactions` DISABLE KEYS */;
INSERT INTO `point_transactions` VALUES (1,1,2,1,'successful_offer','2026-06-02 12:53:20'),(2,1,2,1,'high_rating_bonus','2026-06-02 12:53:20'),(3,4,NULL,5,'initial_bonus','2026-06-02 12:53:20'),(4,2,NULL,5,'initial_bonus','2026-06-02 12:53:20'),(5,6,NULL,5,'initial_bonus','2026-06-02 13:01:38'),(6,3,3,1,'meal_pickup','2026-06-02 13:10:16'),(7,2,5,-1,'meal_request','2026-06-02 13:11:53'),(8,1,5,1,'meal_pickup','2026-06-02 13:14:02'),(9,1,5,1,'high_rating_bonus','2026-06-02 13:16:42'),(10,2,6,-1,'meal_request','2026-06-02 13:20:54'),(11,2,7,-1,'meal_request','2026-06-02 13:21:41'),(12,2,8,-1,'meal_request','2026-06-02 13:21:45'),(13,2,9,-1,'meal_request','2026-06-02 13:21:49');
/*!40000 ALTER TABLE `point_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ratings`
--

DROP TABLE IF EXISTS `ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `meal_id` int NOT NULL,
  `consumer_id` int NOT NULL,
  `cook_id` int NOT NULL,
  `rating_value` tinyint NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_id` (`request_id`),
  KEY `meal_id` (`meal_id`),
  KEY `consumer_id` (`consumer_id`),
  KEY `cook_id` (`cook_id`),
  CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`meal_id`) REFERENCES `meals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ratings_ibfk_3` FOREIGN KEY (`consumer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ratings_ibfk_4` FOREIGN KEY (`cook_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ratings`
--

LOCK TABLES `ratings` WRITE;
/*!40000 ALTER TABLE `ratings` DISABLE KEYS */;
INSERT INTO `ratings` VALUES (1,2,3,4,1,5,'Very tasty and fresh.','2026-06-02 12:53:20'),(2,5,4,2,1,5,'good','2026-06-02 13:16:42');
/*!40000 ALTER TABLE `ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requests`
--

DROP TABLE IF EXISTS `requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `meal_id` int NOT NULL,
  `consumer_id` int NOT NULL,
  `status` enum('pending','approved','rejected','picked_up','not_picked_up','rated') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_at` datetime DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `meal_id` (`meal_id`),
  KEY `consumer_id` (`consumer_id`),
  CONSTRAINT `requests_ibfk_1` FOREIGN KEY (`meal_id`) REFERENCES `meals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `requests_ibfk_2` FOREIGN KEY (`consumer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requests`
--

LOCK TABLES `requests` WRITE;
/*!40000 ALTER TABLE `requests` DISABLE KEYS */;
INSERT INTO `requests` VALUES (1,1,2,'approved','2026-04-14 10:00:00','2026-04-14 10:10:00',NULL,NULL),(2,3,4,'picked_up','2026-04-14 09:00:00','2026-04-14 09:05:00','2026-04-14 11:20:00','2026-04-14 11:20:00'),(3,2,2,'picked_up','2026-04-14 12:00:00','2026-06-02 13:10:05','2026-06-02 13:10:16',NULL),(4,1,4,'rejected','2026-04-14 13:00:00',NULL,NULL,NULL),(5,4,2,'rated','2026-06-02 13:11:53','2026-06-02 13:13:58','2026-06-02 13:14:02',NULL),(6,4,2,'pending','2026-06-02 13:20:54',NULL,NULL,NULL),(7,1,2,'pending','2026-06-02 13:21:41',NULL,NULL,NULL),(8,2,2,'pending','2026-06-02 13:21:45',NULL,NULL,NULL),(9,4,2,'pending','2026-06-02 13:21:49',NULL,NULL,NULL);
/*!40000 ALTER TABLE `requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('cook','consumer','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'consumer',
  `points` int NOT NULL DEFAULT '5',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Maria Papadopoulou','maria@unibite.gr','$2a$10$oIjjWyXPIPxy/tpfXiONKe14QOq6UXGusYNScAI/pRcu0Mr6DAERi','cook',10,'2026-06-02 12:53:20'),(2,'Nikos Georgiou','nikos@unibite.gr','$2a$10$UfonICfwRoJZtFfd2Ut3/OTHSDI7fZVK6kHiI.fYDUk1OO82Oa5eu','consumer',0,'2026-06-02 12:53:20'),(3,'Eleni Stavrou','eleni@unibite.gr','$2a$10$OPiW1/wF7BpoLmLD4N22Wusso845gozbC.L6EJuOlQWj4QU.FOTFi','cook',11,'2026-06-02 12:53:20'),(4,'Giorgos Antoniou','giorgos@unibite.gr','123456','consumer',4,'2026-06-02 12:53:20'),(5,'Admin User','admin@unibite.gr','$2a$10$.TGfJMfpdza1rrhMQLpdnu1wQEhrSMpSN2X1CKQb/Ulh34cAOV9ZC','admin',0,'2026-06-02 12:53:20'),(6,'Manos Kiousis','manos@unibite.gr','$2a$10$ddeeK38VB.LpwzKffXm.Uun0JHDKyE4M7SUe32Tf3/VKjTumoDP2q','consumer',5,'2026-06-02 13:01:38');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-02 13:30:43
