import unittest
from app import create_app


class AppTests(unittest.TestCase):
    def test_stats_are_json_no_store_and_local_aggregate_only(self):
        data = {'cpu_percent': 32, 'memory_percent': 64, 'packets_sent': 124500, 'packets_recv': 94000, 'sampled_at': 123456}
        response = create_app(stats_provider=lambda: data).test_client().get('/stats')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, data)
        self.assertEqual(response.headers['Cache-Control'], 'no-store')
        self.assertNotIn('Access-Control-Allow-Origin', response.headers)

    def test_collection_failure_is_generic_and_retryable(self):
        def unavailable():
            raise OSError('private-machine-path')
        response = create_app(stats_provider=unavailable).test_client().get('/stats')
        self.assertEqual(response.status_code, 503)
        self.assertIn('error', response.json)
        self.assertNotIn('private-machine-path', response.get_data(as_text=True))


if __name__ == '__main__':
    unittest.main()
