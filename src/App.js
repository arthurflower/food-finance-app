import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, TrendingUp, DollarSign, ShoppingCart, Calendar, Trash2, Edit3, Sparkles, Zap, AlertCircle, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const FoodFinanceDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [weight, setWeight] = useState('');
  const [cost, setCost] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('');

  // Load saved expenses from localStorage on mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('foodExpenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('foodExpenses', JSON.stringify(expenses));
  }, [expenses]);

  // Enhanced mock data with common purchase units
  const getMockData = (query) => {
    const lowerQuery = query.toLowerCase();
    
    const mockDatabase = {
      'chicken': [
        { 
          food_name: 'Chicken Breast', 
          brand_name: 'Perdue', 
          type: 'branded', 
          common_units: [
            { unit: 'lb', multiplier: 1, typical_sizes: ['1 lb', '2 lbs', '3 lbs'] },
            { unit: 'oz', multiplier: 0.0625, typical_sizes: ['8 oz', '16 oz', '24 oz'] },
            { unit: 'breast', multiplier: 0.5, typical_sizes: ['2 breasts', '4 breasts', '6 breasts'] }
          ],
          serving_unit: 'lb', 
          nf_calories: 748, 
          nf_protein: 140, 
          nf_total_fat: 16, 
          nf_total_carbohydrate: 0 
        },
        { 
          food_name: 'Rotisserie Chicken', 
          brand_name: 'Costco', 
          type: 'branded', 
          common_units: [
            { unit: 'whole chicken', multiplier: 1, typical_sizes: ['1 whole'] },
            { unit: 'lb', multiplier: 0.33, typical_sizes: ['3 lbs'] }
          ],
          serving_unit: 'whole chicken', 
          nf_calories: 1037, 
          nf_protein: 143, 
          nf_total_fat: 47, 
          nf_total_carbohydrate: 0 
        }
      ],
      'milk': [
        { 
          food_name: 'Whole Milk', 
          brand_name: 'Organic Valley', 
          type: 'branded', 
          common_units: [
            { unit: 'gallon', multiplier: 1, typical_sizes: ['1 gallon'] },
            { unit: 'half gallon', multiplier: 0.5, typical_sizes: ['1/2 gallon'] },
            { unit: 'quart', multiplier: 0.25, typical_sizes: ['1 quart'] },
            { unit: 'cup', multiplier: 0.0625, typical_sizes: ['1 cup', '2 cups'] }
          ],
          serving_unit: 'gallon', 
          nf_calories: 2400, 
          nf_protein: 128, 
          nf_total_fat: 128, 
          nf_total_carbohydrate: 192 
        },
        { 
          food_name: 'Almond Milk', 
          brand_name: 'Silk', 
          type: 'branded',
          common_units: [
            { unit: 'half gallon', multiplier: 1, typical_sizes: ['64 oz'] },
            { unit: 'quart', multiplier: 0.5, typical_sizes: ['32 oz'] },
            { unit: 'cup', multiplier: 0.03125, typical_sizes: ['1 cup'] }
          ],
          serving_unit: 'half gallon', 
          nf_calories: 240, 
          nf_protein: 8, 
          nf_total_fat: 20, 
          nf_total_carbohydrate: 16 
        }
      ],
      'bread': [
        { 
          food_name: 'Whole Wheat Bread', 
          brand_name: 'Dave\'s Killer', 
          type: 'branded',
          common_units: [
            { unit: 'loaf', multiplier: 1, typical_sizes: ['1 loaf'] },
            { unit: 'slice', multiplier: 0.045, typical_sizes: ['2 slices', '4 slices'] }
          ],
          serving_unit: 'loaf', 
          nf_calories: 1980, 
          nf_protein: 99, 
          nf_total_fat: 27, 
          nf_total_carbohydrate: 396 
        }
      ],
      'eggs': [
        { 
          food_name: 'Large Eggs', 
          brand_name: 'Eggland\'s Best', 
          type: 'branded',
          common_units: [
            { unit: 'dozen', multiplier: 1, typical_sizes: ['1 dozen'] },
            { unit: '18-pack', multiplier: 1.5, typical_sizes: ['18 eggs'] },
            { unit: 'egg', multiplier: 0.083, typical_sizes: ['1 egg', '2 eggs', '3 eggs'] }
          ],
          serving_unit: 'dozen', 
          nf_calories: 840, 
          nf_protein: 72, 
          nf_total_fat: 60, 
          nf_total_carbohydrate: 12 
        }
      ],
      'apple': [
        { 
          food_name: 'Gala Apples', 
          brand_name: 'Organic Valley', 
          type: 'branded',
          common_units: [
            { unit: 'lb', multiplier: 1, typical_sizes: ['3 lbs', '5 lbs'] },
            { unit: 'apple', multiplier: 0.33, typical_sizes: ['1 apple', '3 apples', '6 apples'] },
            { unit: 'bag', multiplier: 3, typical_sizes: ['3 lb bag', '5 lb bag'] }
          ],
          serving_unit: 'lb', 
          nf_calories: 236, 
          nf_protein: 1, 
          nf_total_fat: 1, 
          nf_total_carbohydrate: 63 
        }
      ],
      'banana': [
        { 
          food_name: 'Organic Bananas', 
          brand_name: 'Dole', 
          type: 'branded',
          common_units: [
            { unit: 'lb', multiplier: 1, typical_sizes: ['2 lbs', '3 lbs'] },
            { unit: 'banana', multiplier: 0.26, typical_sizes: ['1 banana', '3 bananas', '6 bananas'] },
            { unit: 'bunch', multiplier: 2.5, typical_sizes: ['1 bunch'] }
          ],
          serving_unit: 'lb', 
          nf_calories: 404, 
          nf_protein: 5, 
          nf_total_fat: 1, 
          nf_total_carbohydrate: 103 
        }
      ],
      'steak': [
        {
          food_name: 'Ribeye Steak',
          brand_name: 'USDA Choice',
          type: 'branded',
          common_units: [
            { unit: 'oz', multiplier: 0.0625, typical_sizes: ['8 oz', '12 oz', '16 oz'] },
            { unit: 'lb', multiplier: 1, typical_sizes: ['0.75 lb', '1 lb', '1.5 lbs'] },
            { unit: 'steak', multiplier: 0.75, typical_sizes: ['1 steak'] }
          ],
          serving_unit: 'lb',
          nf_calories: 1137,
          nf_protein: 94,
          nf_total_fat: 83,
          nf_total_carbohydrate: 0
        }
      ]
    };

    // Find matching products
    let results = [];
    for (const [key, products] of Object.entries(mockDatabase)) {
      if (key.includes(lowerQuery) || lowerQuery.includes(key)) {
        results = [...results, ...products];
      }
    }

    // If no exact matches, return generic items
    if (results.length === 0 && query.length > 2) {
      results = [
        { 
          food_name: query, 
          brand_name: 'Generic', 
          type: 'common',
          common_units: [
            { unit: 'serving', multiplier: 1, typical_sizes: ['1 serving'] },
            { unit: 'lb', multiplier: 1, typical_sizes: ['1 lb'] },
            { unit: 'oz', multiplier: 0.0625, typical_sizes: ['8 oz', '16 oz'] }
          ],
          serving_unit: 'serving', 
          nf_calories: 100, 
          nf_protein: 10, 
          nf_total_fat: 5, 
          nf_total_carbohydrate: 20 
        }
      ];
    }

    return results;
  };

  // Search function
  const searchProducts = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API delay
    setTimeout(() => {
      const results = getMockData(query);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm && !selectedProduct) {
        searchProducts(searchTerm);
        setShowSuggestions(true);
      } else if (!searchTerm) {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedProduct]);

  // Update selected unit when product changes
  useEffect(() => {
    if (selectedProduct && selectedProduct.common_units) {
      setSelectedUnit(selectedProduct.common_units[0].unit);
    }
  }, [selectedProduct]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate nutrition based on selected unit
  const calculateNutrition = (product, amount, unit) => {
    if (!product || !amount || !unit) return null;
    
    const unitInfo = product.common_units?.find(u => u.unit === unit);
    if (!unitInfo) return null;
    
    const multiplier = unitInfo.multiplier;
    return {
      calories: Math.round(product.nf_calories * amount * multiplier),
      protein: Math.round(product.nf_protein * amount * multiplier),
      fat: Math.round(product.nf_total_fat * amount * multiplier),
      carbs: Math.round(product.nf_total_carbohydrate * amount * multiplier)
    };
  };

  // Calculate analytics (enhanced with nutrition data)
  const analytics = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + exp.cost, 0);
    const avgPerItem = expenses.length ? total / expenses.length : 0;
    
    const totalCalories = expenses.reduce((sum, exp) => sum + exp.totalCalories, 0);
    const totalProtein = expenses.reduce((sum, exp) => sum + exp.totalProtein, 0);
    const totalFat = expenses.reduce((sum, exp) => sum + exp.totalFat, 0);
    const totalCarbs = expenses.reduce((sum, exp) => sum + exp.totalCarbs, 0);
    
    const categoryTotals = expenses.reduce((acc, exp) => {
      const category = exp.category || 'Groceries';
      acc[category] = (acc[category] || 0) + exp.cost;
      return acc;
    }, {});
    
    const dailyExpenses = expenses.reduce((acc, exp) => {
      const date = exp.date.split('T')[0];
      acc[date] = (acc[date] || 0) + exp.cost;
      return acc;
    }, {});

    const dailyCalories = expenses.reduce((acc, exp) => {
      const date = exp.date.split('T')[0];
      if (!acc[date]) {
        acc[date] = { calories: 0, protein: 0, fat: 0, carbs: 0 };
      }
      acc[date].calories += exp.totalCalories;
      acc[date].protein += exp.totalProtein;
      acc[date].fat += exp.totalFat;
      acc[date].carbs += exp.totalCarbs;
      return acc;
    }, {});

    const sortedDates = Object.entries(dailyExpenses).sort((a, b) => a[0].localeCompare(b[0]));
    const last7Days = sortedDates.slice(-7);
    
    const chartData = last7Days.map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: amount,
      calories: dailyCalories[date]?.calories || 0
    }));

    const nutritionData = [
      { name: 'Protein', value: totalProtein, color: '#10b981' },
      { name: 'Fat', value: totalFat, color: '#f59e0b' },
      { name: 'Carbs', value: totalCarbs, color: '#3b82f6' }
    ];

    const pieData = Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: amount
    }));

    return { 
      total, 
      avgPerItem, 
      categoryTotals, 
      chartData, 
      pieData,
      totalCalories,
      totalProtein,
      totalFat,
      totalCarbs,
      nutritionData
    };
  }, [expenses]);

  const addExpense = () => {
    if (!selectedProduct || !weight || !cost) return;
    
    const nutrition = calculateNutrition(selectedProduct, parseFloat(weight), selectedUnit);
    if (!nutrition) return;
    
    const newExpense = {
      id: Date.now(),
      food_name: selectedProduct.food_name,
      brand_name: selectedProduct.brand_name || 'Generic',
      category: 'Groceries',
      serving_unit: selectedUnit,
      weight: parseFloat(weight),
      cost: parseFloat(cost),
      pricePerUnit: parseFloat(cost) / parseFloat(weight),
      totalCalories: nutrition.calories,
      totalProtein: nutrition.protein,
      totalFat: nutrition.fat,
      totalCarbs: nutrition.carbs,
      date: new Date().toISOString()
    };

    setExpenses(prev => [newExpense, ...prev]);
    resetForm();
  };

  const updateExpense = () => {
    if (!selectedProduct || !weight || !cost || !editingId) return;
    
    const nutrition = calculateNutrition(selectedProduct, parseFloat(weight), selectedUnit);
    if (!nutrition) return;
    
    setExpenses(prev => prev.map(exp => 
      exp.id === editingId 
        ? {
            ...exp,
            food_name: selectedProduct.food_name,
            brand_name: selectedProduct.brand_name || 'Generic',
            serving_unit: selectedUnit,
            weight: parseFloat(weight),
            cost: parseFloat(cost),
            pricePerUnit: parseFloat(cost) / parseFloat(weight),
            totalCalories: nutrition.calories,
            totalProtein: nutrition.protein,
            totalFat: nutrition.fat,
            totalCarbs: nutrition.carbs
          }
        : exp
    ));
    
    resetForm();
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const editExpense = (expense) => {
    setEditingId(expense.id);
    setSelectedProduct({
      food_name: expense.food_name,
      brand_name: expense.brand_name,
      serving_unit: expense.serving_unit,
      common_units: [{ unit: expense.serving_unit, multiplier: 1, typical_sizes: [] }],
      nf_calories: expense.totalCalories / expense.weight,
      nf_protein: expense.totalProtein / expense.weight,
      nf_total_fat: expense.totalFat / expense.weight,
      nf_total_carbohydrate: expense.totalCarbs / expense.weight
    });
    setWeight(expense.weight.toString());
    setCost(expense.cost.toString());
    setSelectedUnit(expense.serving_unit);
    setSearchTerm(`${expense.brand_name} ${expense.food_name}`);
  };

  const resetForm = () => {
    setSearchTerm('');
    setSelectedProduct(null);
    setWeight('');
    setCost('');
    setShowSuggestions(false);
    setEditingId(null);
    setSearchResults([]);
    setSelectedUnit('');
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchTerm(`${product.brand_name} ${product.food_name}`);
    setShowSuggestions(false);
    setSearchResults([]);
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-32 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
              <h1 className="text-6xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Food Finance Pro
              </h1>
              <Zap className="h-8 w-8 text-yellow-400 animate-bounce" />
            </div>
            <p className="text-xl text-purple-200 font-medium">
              Track your grocery expenses & nutrition with style
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-200">Total Spent</p>
                    <p className="text-3xl font-bold text-white">${analytics.total.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-green-400 drop-shadow-lg" />
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-200">Items</p>
                    <p className="text-3xl font-bold text-white">{expenses.length}</p>
                  </div>
                  <ShoppingCart className="h-10 w-10 text-blue-400 drop-shadow-lg" />
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-200">Total Calories</p>
                    <p className="text-3xl font-bold text-white">{analytics.totalCalories.toLocaleString()}</p>
                  </div>
                  <Flame className="h-10 w-10 text-orange-400 drop-shadow-lg" />
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-200">Avg/Item</p>
                    <p className="text-3xl font-bold text-white">${analytics.avgPerItem.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-yellow-400 drop-shadow-lg" />
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-pink-200">This Week</p>
                    <p className="text-3xl font-bold text-white">
                      ${analytics.chartData.reduce((sum, day) => sum + day.amount, 0).toFixed(2)}
                    </p>
                  </div>
                  <Calendar className="h-10 w-10 text-pink-400 drop-shadow-lg" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Form */}
            <div className="lg:col-span-1">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-75"></div>
                <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                    {editingId ? 'Edit Item' : 'Add Food Item'}
                  </h2>
                  
                  {/* Search Input */}
                  <div className="relative mb-6 search-container">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 h-5 w-5" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          if (selectedProduct && e.target.value !== `${selectedProduct.brand_name} ${selectedProduct.food_name}`) {
                            setSelectedProduct(null);
                          }
                        }}
                        onFocus={() => {
                          if (!selectedProduct) setShowSuggestions(true);
                        }}
                        placeholder="Search foods... (Try 'chicken', 'milk', 'steak')"
                        className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      />
                      {isSearching && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Search Results */}
                    {showSuggestions && searchResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-2 bg-black/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                        {searchResults.map((product, index) => (
                          <div
                            key={`${product.food_name}-${product.brand_name}-${index}`}
                            onClick={() => handleProductSelect(product)}
                            className="px-6 py-4 cursor-pointer hover:bg-white/10 border-b border-white/5 last:border-b-0 transition-all duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-white">{product.brand_name}</div>
                                <div className="text-purple-200 text-sm">{product.food_name}</div>
                                <div className="text-xs text-purple-400 mt-1">
                                  Common sizes: {product.common_units[0].typical_sizes.join(', ')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Product */}
                  {selectedProduct && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/50">
                      <div className="font-semibold text-white">{selectedProduct.brand_name}</div>
                      <div className="text-purple-200 text-sm">{selectedProduct.food_name}</div>
                      <div className="text-xs text-orange-300 mt-2">
                        Per {selectedProduct.serving_unit}: {selectedProduct.nf_calories} cal | 
                        {selectedProduct.nf_protein}g protein | 
                        {selectedProduct.nf_total_fat}g fat | 
                        {selectedProduct.nf_total_carbohydrate}g carbs
                      </div>
                    </div>
                  )}

                  {/* Unit Selection */}
                  {selectedProduct && selectedProduct.common_units && (
                    <div className="mb-6">
                      <label className="block text-white font-medium mb-3">Select Unit</label>
                      <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="w-full px-4 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      >
                        {selectedProduct.common_units.map((unit) => (
                          <option key={unit.unit} value={unit.unit}>
                            {unit.unit} {unit.typical_sizes.length > 0 && `(${unit.typical_sizes[0]})`}
                          </option>
                        ))}
                      </select>
                      {selectedUnit && selectedProduct.common_units.find(u => u.unit === selectedUnit)?.typical_sizes.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedProduct.common_units.find(u => u.unit === selectedUnit).typical_sizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => setWeight(size.replace(/[^0-9.]/g, ''))}
                              className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 rounded-lg text-xs text-purple-200 transition-all"
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Weight Input */}
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-3">
                      Quantity {selectedUnit && `(${selectedUnit})`}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder={selectedUnit ? `Enter number of ${selectedUnit}` : "Enter amount"}
                      className="w-full px-4 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  {/* Cost Input */}
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-3">Total Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="Enter total cost"
                      className="w-full px-4 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  {/* Price & Nutrition Calculation */}
                  {weight && cost && selectedProduct && selectedUnit && (
                    <div className="mb-6 space-y-3">
                      <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-400/50">
                        <div className="text-green-200 font-medium">
                          💰 Price per {selectedUnit}: ${(parseFloat(cost) / parseFloat(weight)).toFixed(2)}
                        </div>
                      </div>
                      {(() => {
                        const nutrition = calculateNutrition(selectedProduct, parseFloat(weight), selectedUnit);
                        return nutrition ? (
                          <div className="p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-400/50">
                            <div className="text-orange-200 font-medium">
                              🔥 Total: {nutrition.calories} calories
                            </div>
                            <div className="text-xs text-orange-300 mt-1">
                              {nutrition.protein}g protein | 
                              {nutrition.fat}g fat | 
                              {nutrition.carbs}g carbs
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={editingId ? updateExpense : addExpense}
                      disabled={!selectedProduct || !weight || !cost}
                      className="relative flex-1 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300 group-disabled:opacity-30"></div>
                      <div className="relative bg-black/50 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black/70 transition-all duration-300">
                        <Plus className="h-5 w-5" />
                        {editingId ? 'Update' : 'Add Item'}
                      </div>
                    </button>
                    
                    {editingId && (
                      <button
                        onClick={resetForm}
                        className="px-6 py-4 border border-white/30 text-white rounded-xl hover:bg-white/10 transition-all duration-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Data */}
            <div className="lg:col-span-2 space-y-8">
              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-50"></div>
                  <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-cyan-400" />
                      Weekly Spending
                    </h3>
                    {analytics.chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={analytics.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" stroke="#a855f7" fontSize={12} />
                          <YAxis stroke="#a855f7" fontSize={12} />
                          <Tooltip 
                            formatter={(value) => [`${value.toFixed(2)}`, 'Amount']}
                            contentStyle={{
                              backgroundColor: 'rgba(0,0,0,0.8)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '12px',
                              backdropFilter: 'blur(12px)',
                              color: '#ffffff'
                            }}
                            labelStyle={{ color: '#a855f7' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#06b6d4" 
                            strokeWidth={4}
                            dot={{ fill: '#06b6d4', strokeWidth: 3, r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-52 text-purple-300">
                        Add expenses to see trends
                      </div>
                    )}
                  </div>
                </div>

                {/* Nutrition Breakdown */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-50"></div>
                  <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-400" />
                      Nutrition Breakdown
                    </h3>
                    {analytics.nutritionData.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={analytics.nutritionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analytics.nutritionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value}g`, 'Amount']}
                            contentStyle={{
                              backgroundColor: 'rgba(0,0,0,0.8)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '12px',
                              color: '#ffffff'
                            }}
                            labelStyle={{ color: '#a855f7' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-52 text-purple-300">
                        Add items to see nutrition data
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calorie Trend */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur opacity-50"></div>
                  <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-400" />
                      Daily Calories
                    </h3>
                    {analytics.chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={analytics.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" stroke="#a855f7" fontSize={12} />
                          <YAxis stroke="#a855f7" fontSize={12} />
                          <Tooltip 
                            formatter={(value) => [`${value} cal`, 'Calories']}
                            contentStyle={{
                              backgroundColor: 'rgba(0,0,0,0.8)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '12px',
                              color: '#ffffff'
                            }}
                            labelStyle={{ color: '#a855f7' }}
                          />
                          <Bar dataKey="calories" fill="#f97316" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-52 text-purple-300">
                        Track items to see calorie trends
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Pie */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl blur opacity-50"></div>
                  <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-pink-400" />
                      Spending by Category
                    </h3>
                    {analytics.pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={analytics.pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analytics.pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value.toFixed(2)}`, 'Amount']}
                            contentStyle={{
                              backgroundColor: 'rgba(0,0,0,0.8)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '12px',
                              color: '#ffffff'
                            }}
                            labelStyle={{ color: '#a855f7' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-52 text-purple-300">
                        Add items to see distribution
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Purchase List */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-50"></div>
                <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                  <div className="p-6 border-b border-white/20">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-purple-400" />
                      Recent Purchases
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {expenses.length === 0 ? (
                      <div className="p-8 text-center text-purple-300">
                        <div className="text-6xl mb-4">🛒</div>
                        <div className="text-xl">Ready to track your food expenses?</div>
                        <div className="text-sm mt-2 opacity-75">Search for items and start adding!</div>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/10">
                        {expenses.map((expense) => (
                          <div key={expense.id} className="p-4 hover:bg-white/5 transition-all duration-300 group/item">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="font-semibold text-white">{expense.brand_name}</div>
                                    <div className="text-purple-200">{expense.food_name}</div>
                                    <div className="text-xs text-purple-400 mt-1">
                                      {expense.weight} {expense.serving_unit} • ${expense.pricePerUnit.toFixed(2)}/{expense.serving_unit}
                                    </div>
                                    <div className="text-xs text-orange-400 mt-1">
                                      🔥 {expense.totalCalories} cal • {expense.totalProtein}g P • {expense.totalFat}g F • {expense.totalCarbs}g C
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-2xl text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">
                                      ${expense.cost.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-purple-400">
                                      {new Date(expense.date).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                                <button
                                  onClick={() => editExpense(expense)}
                                  className="p-2 text-purple-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteExpense(expense.id)}
                                  className="p-2 text-purple-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodFinanceDashboard;