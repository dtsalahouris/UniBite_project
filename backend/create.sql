DROP DATABASE IF EXISTS unibite;
CREATE DATABASE unibite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE unibite;


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('cook', 'consumer', 'admin') NOT NULL DEFAULT 'consumer',
    points INT NOT NULL DEFAULT 5,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE meals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cook_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    photo_path VARCHAR(255) NULL,
    notes TEXT NULL,
    portions_total INT NOT NULL,
    portions_available INT NOT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    pickup_time DATETIME NOT NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (cook_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE allergens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE meal_allergens (
    meal_id INT NOT NULL,
    allergen_id INT NOT NULL,
    PRIMARY KEY (meal_id, allergen_id),
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY (allergen_id) REFERENCES allergens(id) ON DELETE CASCADE
);

CREATE TABLE requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meal_id INT NOT NULL,
    consumer_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'picked_up', 'not_picked_up', 'rated')
        NOT NULL DEFAULT 'pending',
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME NULL,
    picked_up_at DATETIME NULL,
    completed_at DATETIME NULL,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY (consumer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL UNIQUE,
    meal_id INT NOT NULL,
    consumer_id INT NOT NULL,
    cook_id INT NOT NULL,
    rating_value TINYINT NOT NULL,
    comment TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY (consumer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cook_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE point_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    request_id INT NULL,
    change_amount INT NOT NULL,
    reason VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL
);