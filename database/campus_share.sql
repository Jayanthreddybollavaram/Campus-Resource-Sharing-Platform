

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


--
-- Database: `campus_share`
--

-- --------------------------------------------------------

--
-- Table structure for table `borrowings`
--

CREATE TABLE `borrowings` (
  `borrowing_id` int(11) NOT NULL,
  `resource_id` int(11) NOT NULL,
  `borrower_id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `borrow_date` date NOT NULL,
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `status` enum('Borrowed','Returned','Overdue') NOT NULL DEFAULT 'Borrowed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `borrowings`
--

INSERT INTO `borrowings` (`borrowing_id`, `resource_id`, `borrower_id`, `owner_id`, `borrow_date`, `due_date`, `return_date`, `status`) VALUES
(1, 8, 2, 4, '2026-05-18', '2026-05-25', NULL, 'Borrowed'),
(2, 4, 3, 5, '2026-05-10', '2026-05-20', '2026-05-19', 'Returned');

-- --------------------------------------------------------

--
-- Table structure for table `borrow_requests`
--

CREATE TABLE `borrow_requests` (
  `request_id` int(11) NOT NULL,
  `resource_id` int(11) NOT NULL,
  `requester_id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `request_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `expected_return_date` date NOT NULL,
  `message` text DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected','Cancelled','Returned') NOT NULL DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `borrow_requests`
--

INSERT INTO `borrow_requests` (`request_id`, `resource_id`, `requester_id`, `owner_id`, `request_date`, `expected_return_date`, `message`, `status`) VALUES
(1, 1, 4, 2, '2026-05-17 05:00:00', '2026-05-25', 'I need the calculator for my end semester examination next week.', 'Pending'),
(2, 2, 5, 3, '2026-05-16 08:45:00', '2026-05-30', 'Need the drawing kit for submission of Engineering Graphics sheets.', 'Pending'),
(3, 3, 2, 4, '2026-05-15 03:30:00', '2026-05-22', 'Working on our mini-project prototype demo.', 'Approved'),
(4, 4, 3, 5, '2026-05-10 05:30:00', '2026-05-20', 'Preparing for coding interviews and semester tests.', 'Returned');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `category_name`) VALUES
(5, 'Academic'),
(2, 'Books'),
(3, 'Calculators'),
(1, 'Electronics'),
(4, 'Lab Kits'),
(7, 'Others'),
(6, 'Sports');

-- --------------------------------------------------------

--
-- Table structure for table `resources`
--

CREATE TABLE `resources` (
  `resource_id` int(11) NOT NULL,
  `resource_name` varchar(150) NOT NULL,
  `category` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `condition_state` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `availability` enum('Available','Borrowed','Reserved','Under Maintenance') NOT NULL DEFAULT 'Available',
  `borrow_duration` varchar(50) NOT NULL DEFAULT '7 Days',
  `image` varchar(255) DEFAULT 'default_resource.png',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `resources`
--

INSERT INTO `resources` (`resource_id`, `resource_name`, `category`, `description`, `condition_state`, `owner_id`, `availability`, `borrow_duration`, `image`, `created_at`) VALUES
(1, 'Scientific Calculator (Casio fx-991ES Plus)', 'Calculators', 'Casio fx-991ES Plus scientific calculator in excellent working condition. Suitable for Engineering Mathematics and semester exams.', 'Good', 2, 'Available', '14 Days', 'calc.png', '2026-09-22 16:01:01'),
(2, 'Engineering Drawing Kit', 'Academic', 'Complete engineering graphics instrument box including drafter, compass, set squares, and roller scale in durable case.', 'Excellent', 3, 'Available', '21 Days', 'drawing_kit.png', '2026-09-22 16:01:01'),
(3, 'Arduino UNO Starter Kit', 'Electronics', 'Complete Arduino Uno R3 board with breadboard, jumper wires, LEDs, sensors, and USB cable for IoT and embedded projects.', 'Good', 4, 'Available', '7 Days', 'arduino.png', '2026-09-22 16:01:01'),
(4, 'Data Structures and Algorithms in Java', 'Books', 'Classic DSA textbook by Robert Lafore. Clean pages, no torn sheets, highlighted important concepts for semester prep.', 'Like New', 5, 'Available', '30 Days', 'dsa_book.png', '2026-09-22 16:01:01'),
(5, 'Digital Multimeter with Probes', 'Lab Kits', 'Digital multimeter suitable for BEE, analog and digital electronics lab experiments with spare fuses.', 'Excellent', 6, 'Available', '7 Days', 'multimeter.png', '2026-09-22 16:01:01'),
(6, 'Raspberry Pi 4 Model B (4GB)', 'Electronics', 'Raspberry Pi 4 (4GB RAM) with official power adapter, 32GB SD card preloaded with Raspberry Pi OS.', 'Good', 2, 'Available', '10 Days', 'raspberry.png', '2026-09-22 16:01:01'),
(7, 'Core Java: An Integrated Approach', 'Books', 'Comprehensive Java textbook by Dr. R. Nageswara Rao covering core concepts, collections, threads, and JDBC.', 'Good', 3, 'Available', '20 Days', 'java.png', '2026-09-22 16:01:01'),
(8, '8085 Microprocessor Trainer Kit Manual', 'Academic', 'Laboratory manual and instruction set reference booklet for 8085 microprocessor experiments.', 'Good', 4, 'Borrowed', '7 Days', 'micro_manual.png', '2026-09-22 16:01:01');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `transaction_id` int(11) NOT NULL,
  `resource_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `transaction_type` varchar(50) NOT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `description` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`transaction_id`, `resource_id`, `user_id`, `transaction_type`, `transaction_date`, `description`) VALUES
(1, 1, 2, 'Listed', '2026-05-14 03:30:00', 'Rahul Sharma listed \"Scientific Calculator (Casio fx-991ES Plus)\"'),
(2, 2, 3, 'Listed', '2026-05-14 05:00:00', 'Priya Singh listed \"Engineering Drawing Kit\"'),
(3, 3, 4, 'Listed', '2026-05-14 06:15:00', 'Amit Kumar listed \"Arduino UNO Starter Kit\"'),
(4, 1, 4, 'Requested', '2026-05-17 05:00:00', 'Amit Kumar requested to borrow \"Scientific Calculator\" from Rahul Sharma'),
(5, 8, 2, 'Borrowed', '2026-05-18 05:30:00', 'Rahul Sharma borrowed \"8085 Microprocessor Trainer Kit Manual\" from Amit Kumar'),
(6, 4, 3, 'Returned', '2026-05-19 11:00:00', 'Priya Singh returned \"Data Structures and Algorithms in Java\" to Neha Patel');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `roll_number` varchar(50) NOT NULL,
  `email` varchar(120) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `department` varchar(50) NOT NULL,
  `year` varchar(20) DEFAULT 'N/A',
  `gender` varchar(10) DEFAULT 'Other',
  `password` varchar(255) NOT NULL,
  `role` enum('Student','Faculty','Administrator') NOT NULL DEFAULT 'Student',
  `student_id` varchar(50) DEFAULT NULL,
  `status` enum('Active','Disabled') NOT NULL DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `roll_number`, `email`, `mobile`, `department`, `year`, `gender`, `password`, `role`, `student_id`, `status`, `created_at`) VALUES
(1, 'Administrator', 'ADM001', 'admin@campusshare.edu', '9999988888', 'Administration', 'Staff', 'Other', 'admin123', 'Administrator', 'ADM-001', 'Active', '2026-09-22 16:01:01'),
(2, 'Rahul Sharma', '22CSE123', 'rahul.cse@campusshare.edu', '9876543210', 'CSE', '3rd Year', 'Male', 'password123', 'Student', 'STU-101', 'Active', '2026-09-22 16:01:01'),
(3, 'Priya Singh', '22ECE031', 'priya.ece@campusshare.edu', '9876543211', 'ECE', '2nd Year', 'Female', 'password123', 'Student', 'STU-102', 'Active', '2026-09-22 16:01:01'),
(4, 'Amit Kumar', '22CSE054', 'amit.cse@campusshare.edu', '9876543212', 'CSE', '2nd Year', 'Male', 'password123', 'Student', 'STU-103', 'Active', '2026-09-22 16:01:01'),
(5, 'Neha Patel', '23IT045', 'neha.it@campusshare.edu', '9876543213', 'IT', '3rd Year', 'Female', 'password123', 'Student', 'STU-104', 'Active', '2026-09-22 16:01:01'),
(6, 'Dr. Ramesh Rao', 'FAC009', 'ramesh.rao@campusshare.edu', '9876543214', 'ECE', 'Faculty', 'Male', 'faculty123', 'Faculty', 'FAC-009', 'Active', '2026-09-22 16:01:01');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `borrowings`
--
ALTER TABLE `borrowings`
  ADD PRIMARY KEY (`borrowing_id`),
  ADD KEY `fk_borrowing_resource` (`resource_id`),
  ADD KEY `fk_borrowing_borrower` (`borrower_id`),
  ADD KEY `fk_borrowing_owner` (`owner_id`);

--
-- Indexes for table `borrow_requests`
--
ALTER TABLE `borrow_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `fk_request_resource` (`resource_id`),
  ADD KEY `fk_request_requester` (`requester_id`),
  ADD KEY `fk_request_owner` (`owner_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_name` (`category_name`);

--
-- Indexes for table `resources`
--
ALTER TABLE `resources`
  ADD PRIMARY KEY (`resource_id`),
  ADD KEY `fk_resource_owner` (`owner_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `fk_trans_resource` (`resource_id`),
  ADD KEY `fk_trans_user` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `roll_number` (`roll_number`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `borrowings`
--
ALTER TABLE `borrowings`
  MODIFY `borrowing_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `borrow_requests`
--
ALTER TABLE `borrow_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `resources`
--
ALTER TABLE `resources`
  MODIFY `resource_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `borrowings`
--
ALTER TABLE `borrowings`
  ADD CONSTRAINT `fk_borrowing_borrower` FOREIGN KEY (`borrower_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_borrowing_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_borrowing_resource` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`resource_id`) ON DELETE CASCADE;

--
-- Constraints for table `borrow_requests`
--
ALTER TABLE `borrow_requests`
  ADD CONSTRAINT `fk_request_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_request_requester` FOREIGN KEY (`requester_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_request_resource` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`resource_id`) ON DELETE CASCADE;

--
-- Constraints for table `resources`
--
ALTER TABLE `resources`
  ADD CONSTRAINT `fk_resource_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_trans_resource` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`resource_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_trans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
