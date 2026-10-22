INSERT INTO users (full_name, email, password, role, points) VALUES
('Maria Papadopoulou', 'maria@unibite.gr', '123456', 'cook', 8),
('Nikos Georgiou', 'nikos@unibite.gr', '123456', 'consumer', 5),
('Eleni Stavrou', 'eleni@unibite.gr', '123456', 'cook', 10),
('Giorgos Antoniou', 'giorgos@unibite.gr', '123456', 'consumer', 4),
('Admin User', 'admin@unibite.gr', 'admin123', 'admin', 0);

INSERT INTO allergens (name) VALUES
('Gluten'),
('Milk'),
('Eggs'),
('Peanuts'),
('Soy'),
('Fish'),
('Crustaceans'),
('Tree Nuts'),
('Celery'),
('Mustard'),
('Sesame'),
('Sulphites'),
('Lupin'),
('Molluscs');

INSERT INTO meals (
    cook_id,
    title,
    photo_path,
    notes,
    portions_total,
    portions_available,
    pickup_location,
    pickup_time,
    latitude,
    longitude,
    created_at
) VALUES
(
    1,
    'Pastitsio',
    'images/pastitsio.jpg',
    'Homemade food, contains bechamel and minced meat.',
    4,
    2,
    'Student Dorm A,Room 12',
    '2026-04-15 14:00:00',
    38.2466,
    21.7346,
    NOW()
),
(
    3,
    'Lentil Soup',
    'images/fakes.jpg',
    'Freshly cooked, ideal for lunch.',
    5,
    5,
    'Engineering School Entrance',
    '2026-04-15 13:30:00',
    38.2500,
    21.7400,
    NOW()
),
(
    1,
    'Cheese Pie',
    'images/tiropita.jpg',
    'Baked this morning,very tasty.',
    3,
    0,
    'Library Building',
    '2026-04-15 11:30:00',
    38.2480,
    21.7355,
    NOW()
);

INSERT INTO meal_allergens (meal_id, allergen_id) VALUES
(1, 1),
(1, 2),
(2, 1),
(3, 1),
(3, 2),
(3, 3);

INSERT INTO requests (meal_id, consumer_id, status, requested_at, approved_at, picked_up_at, completed_at) VALUES
(1, 2, 'approved', '2026-04-14 10:00:00', '2026-04-14 10:10:00', NULL, NULL),
(3, 4, 'picked_up', '2026-04-14 09:00:00', '2026-04-14 09:05:00', '2026-04-14 11:20:00', '2026-04-14 11:20:00'),
(2, 2, 'pending', '2026-04-14 12:00:00', NULL, NULL, NULL),
(1, 4, 'rejected', '2026-04-14 13:00:00', NULL, NULL, NULL);

INSERT INTO ratings (request_id, meal_id, consumer_id, cook_id, rating_value, comment) VALUES
(2, 3, 4, 1, 5, 'Very tasty and fresh.');

INSERT INTO point_transactions (user_id, request_id, change_amount, reason) VALUES
(1, 2, 1, 'successful_offer'),
(1, 2, 1, 'high_rating_bonus'),
(4, NULL, 5, 'initial_bonus'),
(2, NULL, 5, 'initial_bonus');
