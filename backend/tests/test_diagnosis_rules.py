import unittest

from app.routes.diagnosis import rank_diseases


class DiagnosisRuleTests(unittest.TestCase):
    def test_fever_alone_only_matches_fever_even_with_flu_tie_breaker_answers(self):
        ranked = rank_diseases(
            ["fever"],
            {"fever_level": "high", "onset": "sudden", "nasal": "no"},
        )
        self.assertEqual(ranked, [("fever", 1)])

    def test_fever_and_body_ache_can_return_flu_and_fever_as_differential(self):
        ranked = rank_diseases(["fever", "body_ache"])
        self.assertEqual(ranked[0][0], "flu")
        self.assertEqual({disease for disease, _ in ranked}, {"flu", "fever"})

    def test_fever_cough_and_sore_throat_do_not_infer_flu_without_flu_specific_support(self):
        ranked = rank_diseases(["fever", "cough", "sore_throat"])
        self.assertNotIn("flu", {disease for disease, _ in ranked})
        self.assertEqual(ranked[0][0], "cold")

    def test_runny_nose_and_sneezing_return_supported_alternatives(self):
        ranked = rank_diseases(["runny_nose", "sneezing"])
        self.assertEqual(ranked[0][0], "cold")
        self.assertEqual({disease for disease, _ in ranked}, {"cold", "allergy"})


if __name__ == "__main__":
    unittest.main()
