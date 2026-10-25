-- DRVU Online Exam - relational version of the schema (for reports / SQL-based systems)
-- Dembi Dollo Rift Valley University. Prepared by Daba Atm.

CREATE TABLE exam (
  id          INT PRIMARY KEY DEFAULT 1,
  title       VARCHAR(200) NOT NULL,
  duration    INT          NOT NULL CHECK (duration >= 1),   -- minutes
  is_open     BOOLEAN      NOT NULL DEFAULT FALSE,
  show_ans    BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE question (
  id          INT PRIMARY KEY,                 -- question number (0,1,2...)
  text        TEXT NOT NULL,
  correct_opt INT  NOT NULL CHECK (correct_opt BETWEEN 0 AND 4)   -- the answer key
);

CREATE TABLE question_option (
  question_id INT NOT NULL REFERENCES question(id) ON DELETE CASCADE,
  opt_index   INT NOT NULL,                    -- 0 = A, 1 = B ...
  text        VARCHAR(500) NOT NULL,
  PRIMARY KEY (question_id, opt_index)
);

CREATE TABLE student (
  uid         VARCHAR(64) PRIMARY KEY,         -- Firebase Authentication uid
  full_name   VARCHAR(150) NOT NULL,
  username    VARCHAR(30)  NOT NULL UNIQUE     -- login: username@drvu.exam
);

CREATE TABLE exam_attempt (                    -- progress + result (one per student)
  student_uid VARCHAR(64) PRIMARY KEY REFERENCES student(uid) ON DELETE CASCADE,
  started_at  BIGINT  NOT NULL,                -- server time, ms
  submitted_at BIGINT,                         -- NULL = still in progress
  score       INT,                             -- NULL until graded
  total       INT
);

CREATE TABLE answer (
  student_uid VARCHAR(64) NOT NULL REFERENCES exam_attempt(student_uid) ON DELETE CASCADE,
  question_id INT         NOT NULL REFERENCES question(id),
  chosen_opt  INT         NOT NULL,
  PRIMARY KEY (student_uid, question_id)
);

-- Status of a student (calculated):
--   Not started : no row in exam_attempt
--   In progress : submitted_at IS NULL
--   Submitted   : submitted_at IS NOT NULL AND score IS NULL
--   Graded      : score IS NOT NULL
