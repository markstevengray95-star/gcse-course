-- Supporting indexes for Phase 6 intervention foreign-key lookups.
create index if not exists gcse_interventions_class_idx
  on private.gcse_interventions(class_id);

create index if not exists gcse_intervention_attempts_target_idx
  on private.gcse_intervention_attempts(target_id);
