import math
import unittest

from 景深計算工具 import (
    calculate_coc_from_pixel,
    calculate_depth_of_field,
    calculate_hyperfocal_distance,
)


class DepthOfFieldTests(unittest.TestCase):
    def test_pixel_size_times_multiplier_sets_coc(self) -> None:
        self.assertAlmostEqual(calculate_coc_from_pixel(0.002, 2), 0.004)

    def test_hyperfocal_focus_has_infinite_far_depth(self) -> None:
        focal_length, f_number, coc = 24.0, 8.0, 0.03
        hyperfocal = calculate_hyperfocal_distance(focal_length, f_number, coc)

        result = calculate_depth_of_field(focal_length, f_number, coc, hyperfocal)

        self.assertTrue(math.isinf(result.far_limit_mm))
        self.assertAlmostEqual(result.near_limit_mm, hyperfocal / 2)
        self.assertTrue(math.isinf(result.rear_depth_mm))

        beyond_hyperfocal = calculate_depth_of_field(
            focal_length, f_number, coc, hyperfocal + 1
        )
        self.assertTrue(math.isinf(beyond_hyperfocal.far_limit_mm))

    def test_focus_before_hyperfocal_has_finite_depth(self) -> None:
        focal_length, f_number, coc = 50.0, 8.0, 0.03
        hyperfocal = calculate_hyperfocal_distance(focal_length, f_number, coc)
        focus_distance = hyperfocal / 2

        result = calculate_depth_of_field(focal_length, f_number, coc, focus_distance)

        self.assertTrue(math.isfinite(result.far_limit_mm))
        expected_near_limit = focus_distance * focal_length**2 / (
            focal_length**2 + f_number * coc * (focus_distance - focal_length)
        )
        self.assertAlmostEqual(result.near_limit_mm, expected_near_limit, places=8)
        self.assertAlmostEqual(result.far_limit_mm, hyperfocal - focal_length, places=8)

    def test_rejects_focus_distance_not_beyond_focal_length(self) -> None:
        with self.assertRaisesRegex(ValueError, "大於焦距"):
            calculate_depth_of_field(50.0, 8.0, 0.03, 50.0)

    def test_rejects_non_positive_coc(self) -> None:
        with self.assertRaises(ValueError):
            calculate_coc_from_pixel(0.0, 2.0)


if __name__ == "__main__":
    unittest.main()
