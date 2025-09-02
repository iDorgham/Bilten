-- Fix password hashes for test users
UPDATE users.users SET password_hash = '$2a$10$Fz1yPlpG9ikKalMyl4SvI.BiWFKk0MihrITHZtmnhc0TfvrwQ.zs.' WHERE email = 'admin@bilten.com';
UPDATE users.users SET password_hash = '$2a$10$Fz1yPlpG9ikKalMyl4SvI.BiWFKk0MihrITHZtmnhc0TfvrwQ.zs.' WHERE email = 'user@bilten.com';

-- Verify the updates
SELECT email, password_hash FROM users.users WHERE email IN ('admin@bilten.com', 'user@bilten.com');

