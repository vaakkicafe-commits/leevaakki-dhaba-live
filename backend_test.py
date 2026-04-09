#!/usr/bin/env python3
"""
Lee Vaakki Dhaba Backend API Testing Suite
Tests all API endpoints for the food ordering system
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class LeeVaakkiAPITester:
    def __init__(self, base_url: str = "https://load-last-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_user_email = f"testuser_{datetime.now().strftime('%H%M%S')}@test.com"
        self.test_user_data = {
            "name": "Test User",
            "email": self.test_user_email,
            "phone": "9876543210",
            "password": "testpass123"
        }
        
        self.admin_credentials = {
            "email": "admin@leevaakki.com",
            "password": "admin123"
        }

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    headers: Dict = None, use_admin: bool = False) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        request_headers = {'Content-Type': 'application/json'}
        
        # Add authorization if token available
        token = self.admin_token if use_admin else self.token
        if token:
            request_headers['Authorization'] = f'Bearer {token}'
        
        if headers:
            request_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=request_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=request_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=request_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=request_headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}

            return response.status_code, response_data

        except requests.exceptions.RequestException as e:
            return 0, {"error": str(e)}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        status, data = self.make_request('GET', '')
        success = status == 200 and "Lee Vaakki Dhaba API" in str(data)
        self.log_test("Root API endpoint", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_seed_database(self):
        """Test database seeding"""
        status, data = self.make_request('POST', 'seed')
        success = status == 200
        self.log_test("Database seeding", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_user_registration(self):
        """Test user registration"""
        status, data = self.make_request('POST', 'auth/register', self.test_user_data)
        success = status == 200 and 'token' in data and 'user' in data
        
        if success:
            self.token = data['token']
            self.user_id = data['user']['id']
        
        self.log_test("User registration", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_admin_login(self):
        """Test admin login"""
        status, data = self.make_request('POST', 'auth/login', self.admin_credentials)
        success = status == 200 and 'token' in data and 'user' in data
        
        if success:
            self.admin_token = data['token']
        
        self.log_test("Admin login", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        status, data = self.make_request('POST', 'auth/login', login_data)
        success = status == 200 and 'token' in data
        
        self.log_test("User login", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_get_user_profile(self):
        """Test get current user profile"""
        status, data = self.make_request('GET', 'auth/me')
        success = status == 200 and 'email' in data
        
        self.log_test("Get user profile", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_get_menu(self):
        """Test get menu items"""
        status, data = self.make_request('GET', 'menu')
        success = status == 200 and 'items' in data and len(data['items']) > 0
        
        self.log_test("Get menu items", success, 
                     f"Status: {status}, Items: {len(data.get('items', []))}" if not success else "", data)
        return success

    def test_get_categories(self):
        """Test get menu categories"""
        status, data = self.make_request('GET', 'menu/categories')
        success = status == 200 and 'categories' in data
        
        self.log_test("Get menu categories", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_get_menu_by_category(self):
        """Test get menu items by category"""
        status, data = self.make_request('GET', 'menu/category/Starters')
        success = status == 200 and 'items' in data
        
        self.log_test("Get menu by category", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_get_menu_item(self):
        """Test get specific menu item"""
        # First get menu to find an item ID
        status, menu_data = self.make_request('GET', 'menu')
        if status == 200 and menu_data.get('items'):
            item_id = menu_data['items'][0]['id']
            status, data = self.make_request('GET', f'menu/{item_id}')
            success = status == 200 and 'name' in data
        else:
            success = False
            data = {"error": "No menu items found"}
        
        self.log_test("Get specific menu item", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_add_address(self):
        """Test add user address"""
        address_data = {
            "label": "Home",
            "address_line": "123 Test Street",
            "landmark": "Near Test Mall",
            "city": "Test City",
            "pincode": "123456",
            "is_default": True
        }
        status, data = self.make_request('POST', 'addresses', address_data)
        success = status == 200 and 'id' in data
        
        self.log_test("Add user address", success, 
                     f"Status: {status}" if not success else "", data)
        return success, data.get('id') if success else None

    def test_get_addresses(self):
        """Test get user addresses"""
        status, data = self.make_request('GET', 'addresses')
        success = status == 200 and 'addresses' in data
        
        self.log_test("Get user addresses", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_validate_coupon(self):
        """Test coupon validation"""
        status, data = self.make_request('POST', 'coupons/validate?code=WELCOME20&subtotal=500')
        success = status == 200 and 'valid' in data and data['valid']
        
        self.log_test("Validate coupon", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_create_order(self):
        """Test order creation"""
        # First get menu items
        status, menu_data = self.make_request('GET', 'menu')
        if status != 200 or not menu_data.get('items'):
            self.log_test("Create order", False, "No menu items available", {})
            return False, None

        # Get address
        address_success, address_id = self.test_add_address()
        if not address_success:
            self.log_test("Create order", False, "No address available", {})
            return False, None

        # Create order
        order_data = {
            "items": [
                {
                    "menu_item_id": menu_data['items'][0]['id'],
                    "quantity": 2,
                    "customizations": [],
                    "special_instructions": "Test order"
                }
            ],
            "order_type": "delivery",
            "address_id": address_id,
            "payment_method": "cod",
            "coupon_code": "WELCOME20",
            "special_instructions": "Test order instructions"
        }
        
        status, data = self.make_request('POST', 'orders', order_data)
        success = status == 200 and 'order_number' in data
        
        self.log_test("Create order", success, 
                     f"Status: {status}" if not success else "", data)
        return success, data.get('order_number') if success else None

    def test_get_user_orders(self):
        """Test get user orders"""
        status, data = self.make_request('GET', 'orders')
        success = status == 200 and 'orders' in data
        
        self.log_test("Get user orders", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_track_order(self):
        """Test order tracking"""
        # Create an order first
        order_success, order_number = self.test_create_order()
        if not order_success:
            self.log_test("Track order", False, "No order to track", {})
            return False

        status, data = self.make_request('GET', f'orders/track/{order_number}')
        success = status == 200 and 'order_number' in data and 'status' in data
        
        self.log_test("Track order", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_admin_stats(self):
        """Test admin statistics"""
        status, data = self.make_request('GET', 'admin/stats', use_admin=True)
        success = status == 200 and 'total_orders' in data
        
        self.log_test("Admin statistics", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def test_admin_orders(self):
        """Test admin get all orders"""
        status, data = self.make_request('GET', 'admin/orders', use_admin=True)
        success = status == 200 and 'orders' in data
        
        self.log_test("Admin get orders", success, 
                     f"Status: {status}" if not success else "", data)
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Lee Vaakki Dhaba API Tests")
        print("=" * 50)
        
        # Basic API tests
        self.test_root_endpoint()
        self.test_seed_database()
        
        # Authentication tests
        self.test_user_registration()
        self.test_admin_login()
        self.test_user_login()
        self.test_get_user_profile()
        
        # Menu tests
        self.test_get_menu()
        self.test_get_categories()
        self.test_get_menu_by_category()
        self.test_get_menu_item()
        
        # Address tests
        self.test_get_addresses()
        
        # Coupon tests
        self.test_validate_coupon()
        
        # Order tests
        self.test_get_user_orders()
        self.test_track_order()
        
        # Admin tests
        if self.admin_token:
            self.test_admin_stats()
            self.test_admin_orders()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            
            # Print failed tests
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['name']}: {result['details']}")
            
            return 1

def main():
    """Main test runner"""
    tester = LeeVaakkiAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())