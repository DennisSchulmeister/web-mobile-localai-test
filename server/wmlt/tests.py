# Web/Mobile Test for Local AI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.test import SimpleTestCase

class HealthCheckTests(SimpleTestCase):
    def test_health_check_returns_ok(self):
        response = self.client.get("/health-check/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"OK")
