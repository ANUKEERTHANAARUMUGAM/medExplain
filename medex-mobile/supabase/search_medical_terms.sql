-- Ranked autocomplete search over published medical terms.
-- Ranking matches src/components/medicalSearch.js:
--   0 English prefix, 1 English substring,
--   2 Tamil / transliteration prefix, 3 Tamil / transliteration substring.
-- strpos() is used instead of LIKE so user input can't inject wildcards.

create or replace function public.search_medical_terms(q text, lim int default 6)
returns table (
  id bigint,
  english_term text,
  tamil_term text,
  tamil_transliteration text,
  rank int
)
language sql
stable
security invoker
set search_path = public
as $$
  with p as (select lower(trim(q)) as needle)
  select t.id, t.english_term, t.tamil_term, t.tamil_transliteration, r.rank
  from public.medical_terms t
  cross join p
  cross join lateral (
    select case
      when strpos(lower(t.english_term), p.needle) = 1 then 0
      when strpos(lower(t.english_term), p.needle) > 0 then 1
      when strpos(t.tamil_term, p.needle) = 1
        or strpos(lower(coalesce(t.tamil_transliteration, '')), p.needle) = 1 then 2
      else 3
    end as rank
  ) r
  where t.review_status = 'published'
    and p.needle <> ''
    and (
      strpos(lower(t.english_term), p.needle) > 0
      or strpos(t.tamil_term, p.needle) > 0
      or strpos(lower(coalesce(t.tamil_transliteration, '')), p.needle) > 0
    )
  order by r.rank, length(t.english_term), t.english_term
  limit lim;
$$;
