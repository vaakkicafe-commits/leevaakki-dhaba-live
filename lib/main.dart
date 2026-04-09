import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

void main() {
  runApp(const LeeVaakkiDhabaApp());
}

class LeeVaakkiDhabaApp extends StatelessWidget {
  const LeeVaakkiDhabaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Lee Vaakki Dhaba',
      theme: ThemeData(
        primaryColor: const Color(0xFF2E7D32),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2E7D32),
          primary: const Color(0xFF2E7D32),
          secondary: const Color(0xFFFF6B35),
        ),
        fontFamily: 'Roboto',
      ),
      home: const MainScreen(),
    );
  }
}

// Data Models
class FoodItem {
  final String id;
  final String name;
  final String description;
  final String imageUrl;
  final double price;
  final String category;
  final bool isVeg;
  final bool isPopular;
  final List<String> tags;

  FoodItem({
    required this.id,
    required this.name,
    required this.description,
    required this.imageUrl,
    required this.price,
    required this.category,
    this.isVeg = true,
    this.isPopular = false,
    this.tags = const [],
  });
}

class CartItem {
  final FoodItem item;
  int quantity;

  CartItem({required this.item, this.quantity = 1});

  double get total => item.price * quantity;
}

// Cart State Management
class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => _items;

  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  double get totalAmount => _items.fold(0, (sum, item) => sum + item.total);

  void addItem(FoodItem food, int quantity) {
    final existingIndex = _items.indexWhere((item) => item.item.id == food.id);
    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
    } else {
      _items.add(CartItem(item: food, quantity: quantity));
    }
    notifyListeners();
  }

  void removeItem(String id) {
    _items.removeWhere((item) => item.item.id == id);
    notifyListeners();
  }

  void updateQuantity(String id, int quantity) {
    final index = _items.indexWhere((item) => item.item.id == id);
    if (index >= 0) {
      if (quantity <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].quantity = quantity;
      }
      notifyListeners();
    }
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}

// Menu Data
class MenuData {
  static List<FoodItem> getAllItems() {
    return [
      // Starters
      FoodItem(
        id: 'starter_1',
        name: 'Paneer Tikka',
        description: 'Marinated cottage cheese cubes grilled to perfection in tandoor',
        price: 320,
        imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=800',
        category: 'Starters',
        isVeg: true,
        isPopular: true,
        tags: ['Bestseller', 'Tandoor'],
      ),
      FoodItem(
        id: 'starter_2',
        name: 'Chicken Tikka',
        description: 'Tender chicken pieces marinated in spices and grilled',
        price: 380,
        imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=800',
        category: 'Starters',
        isVeg: false,
        isPopular: true,
        tags: ['Bestseller', 'Tandoor'],
      ),
      FoodItem(
        id: 'starter_3',
        name: 'Aloo Tikki',
        description: 'Crispy potato patties served with chutneys',
        price: 180,
        imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=800',
        category: 'Starters',
        isVeg: true,
        tags: ['Street Food'],
      ),
      FoodItem(
        id: 'starter_4',
        name: 'Fish Amritsari',
        description: 'Crispy fried fish with Amritsari spices',
        price: 420,
        imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?q=80&w=800',
        category: 'Starters',
        isVeg: false,
        tags: ['Fried', 'Spicy'],
      ),

      // Main Course
      FoodItem(
        id: 'main_1',
        name: 'Butter Chicken',
        description: 'Tender chicken in a rich, creamy tomato gravy with butter',
        price: 450,
        imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=800',
        category: 'Mains',
        isVeg: false,
        isPopular: true,
        tags: ['Bestseller', 'Creamy'],
      ),
      FoodItem(
        id: 'main_2',
        name: 'Dal Makhani',
        description: '12-hour slow cooked black lentils with cream and butter',
        price: 280,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800',
        category: 'Mains',
        isVeg: true,
        isPopular: true,
        tags: ['Bestseller', 'Slow Cooked'],
      ),
      FoodItem(
        id: 'main_3',
        name: 'Kadai Paneer',
        description: 'Cottage cheese cooked with bell peppers in kadai masala',
        price: 320,
        imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=800',
        category: 'Mains',
        isVeg: true,
        tags: ['Spicy', 'Paneer'],
      ),
      FoodItem(
        id: 'main_4',
        name: 'Rogan Josh',
        description: 'Kashmiri style slow-cooked lamb in aromatic spices',
        price: 520,
        imageUrl: 'https://images.unsplash.com/photo-1545247181-516773cae754?q=80&w=800',
        category: 'Mains',
        isVeg: false,
        tags: ['Kashmiri', 'Premium'],
      ),
      FoodItem(
        id: 'main_5',
        name: 'Palak Paneer',
        description: 'Cottage cheese cubes in creamy spinach gravy',
        price: 290,
        imageUrl: 'https://images.unsplash.com/photo-1618449840665-9ed506d73a34?q=80&w=800',
        category: 'Mains',
        isVeg: true,
        tags: ['Healthy', 'Creamy'],
      ),
      FoodItem(
        id: 'main_6',
        name: 'Chicken Biryani',
        description: 'Fragrant basmati rice layered with spiced chicken',
        price: 380,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800',
        category: 'Mains',
        isVeg: false,
        isPopular: true,
        tags: ['Bestseller', 'Rice'],
      ),

      // Breads
      FoodItem(
        id: 'bread_1',
        name: 'Butter Naan',
        description: 'Soft leavened bread brushed with butter',
        price: 60,
        imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800',
        category: 'Breads',
        isVeg: true,
        isPopular: true,
      ),
      FoodItem(
        id: 'bread_2',
        name: 'Garlic Naan',
        description: 'Naan topped with garlic and coriander',
        price: 80,
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800',
        category: 'Breads',
        isVeg: true,
      ),
      FoodItem(
        id: 'bread_3',
        name: 'Laccha Paratha',
        description: 'Layered whole wheat bread',
        price: 70,
        imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800',
        category: 'Breads',
        isVeg: true,
      ),
      FoodItem(
        id: 'bread_4',
        name: 'Stuffed Kulcha',
        description: 'Naan stuffed with spiced potatoes or paneer',
        price: 100,
        imageUrl: 'https://images.unsplash.com/photo-1574653853027-5d65dd32e2cd?q=80&w=800',
        category: 'Breads',
        isVeg: true,
        tags: ['Stuffed'],
      ),

      // Combos/Thalis
      FoodItem(
        id: 'combo_1',
        name: 'Veg Thali',
        description: 'Dal, Paneer, Sabzi, Rice, 2 Rotis, Raita, Salad, Sweet',
        price: 350,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800',
        category: 'Combos',
        isVeg: true,
        isPopular: true,
        tags: ['Value', 'Complete Meal'],
      ),
      FoodItem(
        id: 'combo_2',
        name: 'Non-Veg Thali',
        description: 'Chicken Curry, Dal, Rice, 2 Rotis, Raita, Salad, Sweet',
        price: 450,
        imageUrl: 'https://images.unsplash.com/photo-1567337710282-00832b415979?q=80&w=800',
        category: 'Combos',
        isVeg: false,
        isPopular: true,
        tags: ['Value', 'Complete Meal'],
      ),
      FoodItem(
        id: 'combo_3',
        name: 'Biryani Combo',
        description: 'Chicken Biryani with Raita and Salan',
        price: 420,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800',
        category: 'Combos',
        isVeg: false,
        tags: ['Rice', 'Combo'],
      ),

      // Beverages
      FoodItem(
        id: 'bev_1',
        name: 'Masala Chai',
        description: 'Traditional Indian spiced tea',
        price: 50,
        imageUrl: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?q=80&w=800',
        category: 'Beverages',
        isVeg: true,
      ),
      FoodItem(
        id: 'bev_2',
        name: 'Lassi',
        description: 'Sweet or salted yogurt drink',
        price: 80,
        imageUrl: 'https://images.unsplash.com/photo-1626201850760-208b18b474ff?q=80&w=800',
        category: 'Beverages',
        isVeg: true,
        isPopular: true,
      ),
      FoodItem(
        id: 'bev_3',
        name: 'Fresh Lime Soda',
        description: 'Refreshing lime with soda, sweet or salted',
        price: 60,
        imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800',
        category: 'Beverages',
        isVeg: true,
      ),

      // Desserts
      FoodItem(
        id: 'dessert_1',
        name: 'Gulab Jamun',
        description: 'Deep fried milk dumplings in sugar syrup (2 pcs)',
        price: 100,
        imageUrl: 'https://images.unsplash.com/photo-1666190077072-ee1489e7cd5b?q=80&w=800',
        category: 'Desserts',
        isVeg: true,
        isPopular: true,
      ),
      FoodItem(
        id: 'dessert_2',
        name: 'Kulfi',
        description: 'Traditional Indian ice cream with pistachios',
        price: 120,
        imageUrl: 'https://images.unsplash.com/photo-1623073284788-0d846f75e329?q=80&w=800',
        category: 'Desserts',
        isVeg: true,
      ),
      FoodItem(
        id: 'dessert_3',
        name: 'Kheer',
        description: 'Creamy rice pudding with cardamom and nuts',
        price: 110,
        imageUrl: 'https://images.unsplash.com/photo-1631452180539-96aca7d48617?q=80&w=800',
        category: 'Desserts',
        isVeg: true,
      ),
    ];
  }

  static List<String> getCategories() {
    return ['All', 'Starters', 'Mains', 'Breads', 'Combos', 'Beverages', 'Desserts'];
  }

  static List<FoodItem> getPopularItems() {
    return getAllItems().where((item) => item.isPopular).toList();
  }

  static List<FoodItem> getItemsByCategory(String category) {
    if (category == 'All') return getAllItems();
    return getAllItems().where((item) => item.category == category).toList();
  }
}

// Main Screen with Bottom Navigation
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  final CartProvider _cart = CartProvider();

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _cart,
      builder: (context, child) {
        return Scaffold(
          body: IndexedStack(
            index: _currentIndex,
            children: [
              HomePage(cart: _cart),
              MenuPage(cart: _cart),
              CartPage(cart: _cart),
              ContactPage(),
            ],
          ),
          bottomNavigationBar: Container(
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 20,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: (index) => setState(() => _currentIndex = index),
              type: BottomNavigationBarType.fixed,
              selectedItemColor: const Color(0xFF2E7D32),
              unselectedItemColor: Colors.grey,
              items: [
                const BottomNavigationBarItem(
                  icon: Icon(Icons.home_outlined),
                  activeIcon: Icon(Icons.home),
                  label: 'Home',
                ),
                const BottomNavigationBarItem(
                  icon: Icon(Icons.restaurant_menu_outlined),
                  activeIcon: Icon(Icons.restaurant_menu),
                  label: 'Menu',
                ),
                BottomNavigationBarItem(
                  icon: Badge(
                    isLabelVisible: _cart.itemCount > 0,
                    label: Text('${_cart.itemCount}'),
                    child: const Icon(Icons.shopping_cart_outlined),
                  ),
                  activeIcon: Badge(
                    isLabelVisible: _cart.itemCount > 0,
                    label: Text('${_cart.itemCount}'),
                    child: const Icon(Icons.shopping_cart),
                  ),
                  label: 'Cart',
                ),
                const BottomNavigationBarItem(
                  icon: Icon(Icons.info_outline),
                  activeIcon: Icon(Icons.info),
                  label: 'Contact',
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// Home Page
class HomePage extends StatelessWidget {
  final CartProvider cart;

  const HomePage({super.key, required this.cart});

  @override
  Widget build(BuildContext context) {
    final popularItems = MenuData.getPopularItems();

    return Scaffold(
      backgroundColor: const Color(0xFFF8F5F2),
      body: CustomScrollView(
        slivers: [
          // App Bar with Hero
          SliverAppBar(
            expandedHeight: 280,
            floating: false,
            pinned: true,
            backgroundColor: const Color(0xFF2E7D32),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200',
                    fit: BoxFit.cover,
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withOpacity(0.7),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 60,
                    left: 20,
                    right: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Lee Vaakki Dhaba',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF2E7D32),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.star, color: Colors.white, size: 16),
                                  SizedBox(width: 4),
                                  Text('4.5', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'Authentic North Indian Cuisine',
                              style: TextStyle(color: Colors.white70, fontSize: 14),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Categories
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "What's on your mind?",
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 110,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        _buildCategoryCard('Starters', Icons.restaurant, const Color(0xFFFF6B35)),
                        _buildCategoryCard('Mains', Icons.dinner_dining, const Color(0xFF2E7D32)),
                        _buildCategoryCard('Breads', Icons.bakery_dining, const Color(0xFFD4A574)),
                        _buildCategoryCard('Combos', Icons.fastfood, const Color(0xFFE53935)),
                        _buildCategoryCard('Beverages', Icons.local_cafe, const Color(0xFF8D6E63)),
                        _buildCategoryCard('Desserts', Icons.cake, const Color(0xFFEC407A)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Offers Banner
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFF6B35), Color(0xFFE53935)],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'First Order Offer!',
                          style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Get 20% OFF on your first order',
                          style: TextStyle(color: Colors.white70),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'Use code: WELCOME20',
                            style: TextStyle(color: Color(0xFFE53935), fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.local_offer, color: Colors.white, size: 60),
                ],
              ),
            ),
          ),

          // Popular Items
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Popular Dishes',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  TextButton(
                    onPressed: () {},
                    child: const Text('See All'),
                  ),
                ],
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.75,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildFoodCard(context, popularItems[index]),
                childCount: popularItems.length,
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 20)),
        ],
      ),
    );
  }

  Widget _buildCategoryCard(String label, IconData icon, Color color) {
    return Container(
      width: 85,
      margin: const EdgeInsets.only(right: 12),
      child: Column(
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
              border: Border.all(color: color.withOpacity(0.3), width: 2),
            ),
            child: Icon(icon, color: color, size: 32),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildFoodCard(BuildContext context, FoodItem item) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => ItemDetailPage(item: item, cart: cart)),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: Image.network(
                    item.imageUrl,
                    height: 120,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                if (item.isPopular)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF6B35),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'Bestseller',
                        style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: item.isVeg ? Colors.green : Colors.red),
                    ),
                    child: Icon(
                      Icons.circle,
                      size: 8,
                      color: item.isVeg ? Colors.green : Colors.red,
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.description,
                    style: TextStyle(color: Colors.grey[600], fontSize: 11),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '₹${item.price.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: Color(0xFF2E7D32),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2E7D32),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Icon(Icons.add, color: Colors.white, size: 18),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Menu Page
class MenuPage extends StatefulWidget {
  final CartProvider cart;

  const MenuPage({super.key, required this.cart});

  @override
  State<MenuPage> createState() => _MenuPageState();
}

class _MenuPageState extends State<MenuPage> {
  String _selectedCategory = 'All';
  bool _showVegOnly = false;

  @override
  Widget build(BuildContext context) {
    List<FoodItem> items = MenuData.getItemsByCategory(_selectedCategory);
    if (_showVegOnly) {
      items = items.where((item) => item.isVeg).toList();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F5F2),
      appBar: AppBar(
        title: const Text('Our Menu', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          Row(
            children: [
              const Text('Veg Only', style: TextStyle(fontSize: 12)),
              Switch(
                value: _showVegOnly,
                onChanged: (value) => setState(() => _showVegOnly = value),
                activeColor: const Color(0xFF2E7D32),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Category Tabs
          Container(
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.all(12),
              child: Row(
                children: MenuData.getCategories().map((category) {
                  final isSelected = category == _selectedCategory;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedCategory = category),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF2E7D32) : Colors.grey[100],
                        borderRadius: BorderRadius.circular(25),
                      ),
                      child: Text(
                        category,
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.black87,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // Items List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (context, index) => _buildMenuListItem(items[index]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuListItem(FoodItem item) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => ItemDetailPage(item: item, cart: widget.cart)),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    item.imageUrl,
                    width: 100,
                    height: 100,
                    fit: BoxFit.cover,
                  ),
                ),
                Positioned(
                  top: 4,
                  left: 4,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(2),
                      border: Border.all(color: item.isVeg ? Colors.green : Colors.red),
                    ),
                    child: Icon(
                      Icons.circle,
                      size: 8,
                      color: item.isVeg ? Colors.green : Colors.red,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (item.isPopular)
                    Container(
                      margin: const EdgeInsets.only(bottom: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF6B35).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'Bestseller',
                        style: TextStyle(color: Color(0xFFFF6B35), fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  Text(
                    item.name,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.description,
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '₹${item.price.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: Color(0xFF2E7D32),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          widget.cart.addItem(item, 1);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('${item.name} added to cart'),
                              duration: const Duration(seconds: 1),
                              backgroundColor: const Color(0xFF2E7D32),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2E7D32),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('ADD', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Item Detail Page
class ItemDetailPage extends StatefulWidget {
  final FoodItem item;
  final CartProvider cart;

  const ItemDetailPage({super.key, required this.item, required this.cart});

  @override
  State<ItemDetailPage> createState() => _ItemDetailPageState();
}

class _ItemDetailPageState extends State<ItemDetailPage> {
  int quantity = 1;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: const Color(0xFF2E7D32),
            leading: Padding(
              padding: const EdgeInsets.all(8),
              child: CircleAvatar(
                backgroundColor: Colors.white,
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.black),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(widget.item.imageUrl, fit: BoxFit.cover),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black.withOpacity(0.3)],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          border: Border.all(color: widget.item.isVeg ? Colors.green : Colors.red),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Icon(
                          Icons.circle,
                          size: 12,
                          color: widget.item.isVeg ? Colors.green : Colors.red,
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (widget.item.isPopular)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF6B35),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'Bestseller',
                            style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    widget.item.name,
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.item.description,
                    style: TextStyle(fontSize: 16, color: Colors.grey[600], height: 1.5),
                  ),
                  const SizedBox(height: 16),
                  if (widget.item.tags.isNotEmpty)
                    Wrap(
                      spacing: 8,
                      children: widget.item.tags.map((tag) {
                        return Chip(
                          label: Text(tag, style: const TextStyle(fontSize: 12)),
                          backgroundColor: Colors.grey[100],
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                        );
                      }).toList(),
                    ),
                  const SizedBox(height: 24),
                  const Text(
                    'Similar Items',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 150,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: MenuData.getItemsByCategory(widget.item.category)
                          .where((item) => item.id != widget.item.id)
                          .take(4)
                          .map((item) => _buildSimilarItem(item))
                          .toList(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: Row(
          children: [
            Text(
              '₹${widget.item.price.toStringAsFixed(0)}',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF2E7D32)),
            ),
            const Spacer(),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.remove),
                    onPressed: () {
                      if (quantity > 1) setState(() => quantity--);
                    },
                  ),
                  Text('$quantity', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(
                    icon: const Icon(Icons.add),
                    onPressed: () => setState(() => quantity++),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            ElevatedButton(
              onPressed: () {
                widget.cart.addItem(widget.item, quantity);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('${widget.item.name} x$quantity added to cart'),
                    backgroundColor: const Color(0xFF2E7D32),
                    action: SnackBarAction(
                      label: 'VIEW CART',
                      textColor: Colors.white,
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E7D32),
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text(
                'ADD TO CART',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSimilarItem(FoodItem item) {
    return GestureDetector(
      onTap: () => Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => ItemDetailPage(item: item, cart: widget.cart)),
      ),
      child: Container(
        width: 120,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              child: Image.network(item.imageUrl, height: 80, width: 120, fit: BoxFit.cover),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                  Text('₹${item.price.toStringAsFixed(0)}', style: const TextStyle(color: Color(0xFF2E7D32), fontWeight: FontWeight.bold, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Cart Page
class CartPage extends StatelessWidget {
  final CartProvider cart;

  const CartPage({super.key, required this.cart});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F5F2),
      appBar: AppBar(
        title: const Text('Your Cart', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          if (cart.items.isNotEmpty)
            TextButton(
              onPressed: () => cart.clear(),
              child: const Text('Clear All', style: TextStyle(color: Colors.red)),
            ),
        ],
      ),
      body: cart.items.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shopping_cart_outlined, size: 100, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  const Text('Your cart is empty', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Add some delicious items!', style: TextStyle(color: Colors.grey[600])),
                ],
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: cart.items.length,
                    itemBuilder: (context, index) => _buildCartItem(context, cart.items[index]),
                  ),
                ),
                _buildCartSummary(context),
              ],
            ),
    );
  }

  Widget _buildCartItem(BuildContext context, CartItem cartItem) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.network(cartItem.item.imageUrl, width: 80, height: 80, fit: BoxFit.cover),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(cartItem.item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text('₹${cartItem.item.price.toStringAsFixed(0)} each', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          InkWell(
                            onTap: () => cart.updateQuantity(cartItem.item.id, cartItem.quantity - 1),
                            child: const Padding(
                              padding: EdgeInsets.all(8),
                              child: Icon(Icons.remove, size: 16),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text('${cartItem.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          ),
                          InkWell(
                            onTap: () => cart.updateQuantity(cartItem.item.id, cartItem.quantity + 1),
                            child: const Padding(
                              padding: EdgeInsets.all(8),
                              child: Icon(Icons.add, size: 16),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '₹${cartItem.total.toStringAsFixed(0)}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF2E7D32)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.red),
            onPressed: () => cart.removeItem(cartItem.item.id),
          ),
        ],
      ),
    );
  }

  Widget _buildCartSummary(BuildContext context) {
    const double deliveryFee = 40;
    const double taxRate = 0.05;
    final double subtotal = cart.totalAmount;
    final double tax = subtotal * taxRate;
    final double total = subtotal + deliveryFee + tax;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Subtotal'),
              Text('₹${subtotal.toStringAsFixed(0)}'),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Delivery Fee'),
              Text('₹${deliveryFee.toStringAsFixed(0)}'),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Tax (5%)'),
              Text('₹${tax.toStringAsFixed(0)}'),
            ],
          ),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              Text('₹${total.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF2E7D32))),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _sendWhatsAppOrder(context, total),
              icon: const Icon(Icons.message, color: Colors.white),
              label: const Text('Order via WhatsApp', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF25D366),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _sendWhatsAppOrder(BuildContext context, double total) async {
    String orderDetails = "Hi! I'd like to place an order:\n\n";
    for (var item in cart.items) {
      orderDetails += "• ${item.item.name} x${item.quantity} - ₹${item.total.toStringAsFixed(0)}\n";
    }
    orderDetails += "\n*Total: ₹${total.toStringAsFixed(0)}*";
    orderDetails += "\n\nPlease confirm my order. Thank you!";

    final encodedMessage = Uri.encodeComponent(orderDetails);
    final whatsappUrl = "https://wa.me/919876543210?text=$encodedMessage"; // Replace with actual number

    try {
      final uri = Uri.parse(whatsappUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open WhatsApp'), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error opening WhatsApp'), backgroundColor: Colors.red),
        );
      }
    }
  }
}

// Contact Page
class ContactPage extends StatelessWidget {
  const ContactPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F5F2),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: const Color(0xFF2E7D32),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200',
                    fit: BoxFit.cover,
                  ),
                  Container(color: Colors.black.withOpacity(0.4)),
                  const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.restaurant, color: Colors.white, size: 50),
                        SizedBox(height: 8),
                        Text(
                          'Lee Vaakki Dhaba',
                          style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Since 1985',
                          style: TextStyle(color: Colors.white70, fontSize: 16),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // About Section
                  _buildSection(
                    'About Us',
                    'Lee Vaakki Dhaba has been serving authentic North Indian cuisine for over 35 years. Our recipes have been passed down through generations, bringing you the true taste of Punjab.',
                    Icons.info_outline,
                  ),

                  const SizedBox(height: 24),

                  // Location Section
                  _buildInfoCard(
                    'Location',
                    'NH-44, Near Murthal\nSonipat, Haryana 131001',
                    Icons.location_on,
                    const Color(0xFFE53935),
                    onTap: () => _launchMaps(),
                  ),

                  const SizedBox(height: 16),

                  // Hours Section
                  _buildInfoCard(
                    'Opening Hours',
                    'Open 24 Hours\n7 Days a Week',
                    Icons.access_time,
                    const Color(0xFF2E7D32),
                  ),

                  const SizedBox(height: 16),

                  // Contact Section
                  _buildInfoCard(
                    'Contact Us',
                    '+91 98765 43210\ninfo@leevaakkidhaba.com',
                    Icons.phone,
                    const Color(0xFFFF6B35),
                    onTap: () => _launchPhone(),
                  ),

                  const SizedBox(height: 32),

                  // Social Media
                  const Text(
                    'Follow Us',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildSocialButton(Icons.facebook, 'Facebook', const Color(0xFF1877F2)),
                      _buildSocialButton(Icons.camera_alt, 'Instagram', const Color(0xFFE4405F)),
                      _buildSocialButton(Icons.play_circle_fill, 'YouTube', const Color(0xFFFF0000)),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // Special Features
                  const Text(
                    'Our Specialties',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      _buildFeatureChip('Live Tandoor', Icons.local_fire_department),
                      _buildFeatureChip('Family Seating', Icons.family_restroom),
                      _buildFeatureChip('Ample Parking', Icons.local_parking),
                      _buildFeatureChip('AC Dining', Icons.ac_unit),
                      _buildFeatureChip('Pure Veg Available', Icons.eco),
                      _buildFeatureChip('Home Delivery', Icons.delivery_dining),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // WhatsApp Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _launchWhatsApp(),
                      icon: const Icon(Icons.message, color: Colors.white),
                      label: const Text('Chat on WhatsApp', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF25D366),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(String title, String content, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: const Color(0xFF2E7D32)),
            const SizedBox(width: 8),
            Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 12),
        Text(content, style: TextStyle(color: Colors.grey[600], height: 1.6, fontSize: 15)),
      ],
    );
  }

  Widget _buildInfoCard(String title, String content, IconData icon, Color color, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text(content, style: TextStyle(color: Colors.grey[600], height: 1.4)),
                ],
              ),
            ),
            if (onTap != null) Icon(Icons.arrow_forward_ios, color: Colors.grey[400], size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildSocialButton(IconData icon, String label, Color color) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: Colors.white, size: 28),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }

  Widget _buildFeatureChip(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: const Color(0xFF2E7D32)),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontSize: 13)),
        ],
      ),
    );
  }

  void _launchMaps() async {
    final uri = Uri.parse('https://maps.google.com/?q=Lee+Vaakki+Dhaba+Murthal');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _launchPhone() async {
    final uri = Uri.parse('tel:+919876543210');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _launchWhatsApp() async {
    final uri = Uri.parse('https://wa.me/919876543210?text=Hi!%20I%20have%20a%20query%20about%20Lee%20Vaakki%20Dhaba');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
