alter table public.gcse_assessment_attempts drop constraint if exists gcse_assessment_answers_size;
alter table public.gcse_assessment_attempts add constraint gcse_assessment_answers_size check (octet_length(answers::text) <= 300000);
alter table public.gcse_assessment_attempts drop constraint if exists gcse_assessment_review_size;
alter table public.gcse_assessment_attempts add constraint gcse_assessment_review_size check (octet_length(review::text) <= 500000);
alter table public.gcse_assessments drop constraint if exists gcse_assessment_question_payload_size;
alter table public.gcse_assessments add constraint gcse_assessment_question_payload_size check (octet_length(question_payload::text) <= 500000);