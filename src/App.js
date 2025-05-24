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
  const [apiError, setApiError] = useState('');

  // Nutritionix API credentials
  const APP_ID = 'YOUR_APP_ID'; // Replace with your app ID
  const APP_KEY = 'YOUR_APP_KEY'; // Replace with your app key

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

  // Search products using Nutritionix API
  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setApiError('');

    try {
      // Search for both branded and common foods
      const response = await fetch(`https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(query)}`, {
        headers: {
          'x-app-id': APP_ID,
          'x-app-key': APP_KEY
        }
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      // Combine branded and common results
      const combinedResults = [
        ...data.branded.map(item => ({ ...item, type: 'branded' })),
        ...data.common.map(item => ({ ...item, type: 'common' }))
      ];

      setSearchResults(combinedResults.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Search error:', error);
      setApiError('Failed to search. Please check your API credentials.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Get detailed nutrition info for selected item
  const getDetailedNutrition = async (item) => {
    setIsSearching(true);
    setApiError('');

    try {
      let endpoint, body;
      
      if (item.type === 'branded') {
        endpoint = 'https://trackapi.nutritionix.com/v2/search/item';
        body = { nix_item_id: item.nix_item_id };
      } else {
        endpoint = 'https://trackapi.nutritionix.com/v2/natural/nutrients';
        body = { query: item.food_name };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-app-id': APP_ID,
          'x-app-key': APP_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Failed to get nutrition details');
      }

      const data = await response.json();
      const foodData = item.type === 'branded' ? data.foods[0] : data.foods[0];
      
      // Process serving sizes
      const servingSizes = foodData.alt_measures || [];
      const defaultServing = {
        serving_unit: foodData.serving_unit,
        serving_qty: foodData.serving_qty,
        serving_weight_grams: foodData.serving_weight_grams
      };
      
      const allServings = [defaultServing, ...servingSizes];
      
      setSelectedProduct({
        ...foodData,
        common_units: allServings.map(serving => ({
          unit: serving.serving_unit,
          qty: serving.serving_qty,
          grams: serving.serving_weight_grams,
          multiplier: serving.serving_weight_grams / foodData.serving_weight_grams
        }))
      });
      
      setSelectedUnit(defaultServing.serving_unit);
    } catch (error) {
      console.error('Nutrition fetch error:', error);
      setApiError('Failed to get nutrition details. Please try again.');
    } finally {
      setIsSearching(false);
    }
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
    }, 500);

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
    
    const multiplier = unitInfo.multiplier * amount;
    return {
      calories: Math.round((product.nf_calories || 0) * multiplier),
      protein: Math.round((product.nf_protein || 0) * multiplier),
      fat: Math.round((product.nf_total_fat || 0) * multiplier),
      carbs: Math.round((product.nf_total_carbohydrate || 0) * multiplier)
    };
  };

  // Calculate analytics
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
      photo: selectedProduct.photo?.thumb,
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
            totalCarbs: nutrition.carbs,
            photo: selectedProduct.photo?.thumb
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
      common_units: [{ unit: expense.serving_unit, multiplier: 1, grams: 100 }],
      nf_calories: expense.totalCalories / expense.weight,
      nf_protein: expense.totalProtein / expense.weight,
      nf_total_fat: expense.totalFat / expense.weight,
      nf_total_carbohydrate: expense.totalCarbs / expense.weight,
      photo: { thumb: expense.photo }
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
    setApiError('');
  };

  const handleProductSelect = async (product) => {
    setShowSuggestions(false);
    setSearchResults([]);
    await getDetailedNutrition(product);
    setSearchTerm(`${product.brand_name || ''} ${product.food_name}`);
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              <h1 className="text-4xl font-bold text-white">
                Food Finance Pro
              </h1>
              <Zap className="h-6 w-6 text-yellow-400" />
            </div>
            <p className="text-gray-300">
              Track your grocery expenses & nutrition with real data
            </p>
          </div>

          {/* API Setup Notice */}
          {(APP_ID === 'YOUR_APP_ID' || APP_KEY === 'YOUR_APP_KEY') && (
            <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-600 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-300">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">
                  To use real nutrition data, replace APP_ID and APP_KEY in the code with your Nutritionix API credentials.
                  Get them free at <a href="https://www.nutritionix.com/api" target="_blank" rel="noopener noreferrer" className="underline">nutritionix.com/api</a>
                </p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Spent</p>
                  <p className="text-2xl font-bold text-white">${analytics.total.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Items</p>
                  <p className="text-2xl font-bold text-white">{expenses.length}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Calories</p>
                  <p className="text-2xl font-bold text-white">{analytics.totalCalories.toLocaleString()}</p>
                </div>
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg/Item</p>
                  <p className="text-2xl font-bold text-white">${analytics.avgPerItem.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">This Week</p>
                  <p className="text-2xl font-bold text-white">
                    ${analytics.chartData.reduce((sum, day) => sum + day.amount, 0).toFixed(2)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  {editingId ? 'Edit Item' : 'Add Food Item'}
                </h2>
                
                {/* API Error */}
                {apiError && (
                  <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-300 text-sm">
                    {apiError}
                  </div>
                )}
                
                {/* Search Input */}
                <div className="relative mb-4 search-container">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (selectedProduct && e.target.value !== `${selectedProduct.brand_name || ''} ${selectedProduct.food_name}`) {
                          setSelectedProduct(null);
                        }
                      }}
                      onFocus={() => {
                        if (!selectedProduct) setShowSuggestions(true);
                      }}
                      placeholder="Search foods..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Search Results */}
                  {showSuggestions && searchResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                      {searchResults.map((product, index) => (
                        <div
                          key={`${product.nix_item_id || product.tag_id}-${index}`}
                          onClick={() => handleProductSelect(product)}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-700 border-b border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            {product.photo?.thumb && (
                              <img src={product.photo.thumb} alt="" className="w-10 h-10 rounded object-cover" />
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-white text-sm">
                                {product.brand_name || 'Generic'}
                              </div>
                              <div className="text-gray-400 text-xs">{product.food_name}</div>
                              {product.nf_calories && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {Math.round(product.nf_calories)} cal per {product.serving_unit}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Product */}
                {selectedProduct && (
                  <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-700/50">
                    <div className="flex items-center gap-3">
                      {selectedProduct.photo?.thumb && (
                        <img src={selectedProduct.photo.thumb} alt="" className="w-12 h-12 rounded object-cover" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-white">{selectedProduct.brand_name || 'Generic'}</div>
                        <div className="text-gray-300 text-sm">{selectedProduct.food_name}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Per {selectedProduct.serving_qty} {selectedProduct.serving_unit}: {Math.round(selectedProduct.nf_calories)} cal | 
                          {Math.round(selectedProduct.nf_protein)}g protein | 
                          {Math.round(selectedProduct.nf_total_fat)}g fat | 
                          {Math.round(selectedProduct.nf_total_carbohydrate)}g carbs
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unit Selection */}
                {selectedProduct && selectedProduct.common_units && (
                  <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-medium mb-1">Select Unit</label>
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {selectedProduct.common_units.map((unit, index) => (
                        <option key={`${unit.unit}-${index}`} value={unit.unit}>
                          {unit.qty} {unit.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Weight Input */}
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-medium mb-1">
                    Quantity {selectedUnit && `(${selectedUnit})`}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={selectedUnit ? `Number of ${selectedUnit}` : "Enter amount"}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Cost Input */}
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-medium mb-1">Total Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="Enter total cost"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Price & Nutrition Calculation */}
                {weight && cost && selectedProduct && selectedUnit && (
                  <div className="mb-4 space-y-2">
                    <div className="p-2 bg-green-900/30 rounded border border-green-700/50">
                      <div className="text-green-300 text-sm">
                        💰 Price per {selectedUnit}: ${(parseFloat(cost) / parseFloat(weight)).toFixed(2)}
                      </div>
                    </div>
                    {(() => {
                      const nutrition = calculateNutrition(selectedProduct, parseFloat(weight), selectedUnit);
                      return nutrition ? (
                        <div className="p-2 bg-orange-900/30 rounded border border-orange-700/50">
                          <div className="text-orange-300 text-sm">
                            🔥 Total: {nutrition.calories} calories
                          </div>
                          <div className="text-xs text-orange-400 mt-0.5">
                            {nutrition.protein}g P | {nutrition.fat}g F | {nutrition.carbs}g C
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={editingId ? updateExpense : addExpense}
                    disabled={!selectedProduct || !weight || !cost}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {editingId ? 'Update' : 'Add Item'}
                  </button>
                  
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Charts and Data */}
            <div className="lg:col-span-2 space-y-6">
              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Trend Chart */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    Weekly Spending
                  </h3>
                  {analytics.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={analytics.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                        <YAxis stroke="#9CA3AF" fontSize={11} />
                        <Tooltip 
                          formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            color: '#ffffff'
                          }}
                          labelStyle={{ color: '#9CA3AF' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-500">
                      Add expenses to see trends
                    </div>
                  )}
                </div>

                {/* Nutrition Breakdown */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-400" />
                    Nutrition Breakdown
                  </h3>
                  {analytics.nutritionData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={analytics.nutritionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
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
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '6px',
                              color: '#ffffff'
                            }}
                            labelStyle={{ color: '#9CA3AF' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-gray-500">
                        Add items to see nutrition data
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Calorie Trend */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-400" />
                    Daily Calories
                  </h3>
                  {analytics.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                        <YAxis stroke="#9CA3AF" fontSize={11} />
                        <Tooltip 
                          formatter={(value) => [`${value} cal`, 'Calories']}
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            color: '#ffffff'
                          }}
                          labelStyle={{ color: '#9CA3AF' }}
                        />
                        <Bar dataKey="calories" fill="#f97316" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-500">
                      Track items to see calorie trends
                    </div>
                  )}
                </div>

                {/* Category Pie */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    Spending by Category
                  </h3>
                  {analytics.pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={analytics.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
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
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            color: '#ffffff'
                          }}
                          labelStyle={{ color: '#9CA3AF' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-500">
                      Add items to see distribution
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase List */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-purple-400" />
                    Recent Purchases
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {expenses.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="text-5xl mb-3">🛒</div>
                      <div className="text-lg">Ready to track your food expenses?</div>
                      <div className="text-sm mt-1">Search for items and start adding!</div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700">
                      {expenses.map((expense) => (
                        <div key={expense.id} className="p-3 hover:bg-gray-700/50 transition-colors group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {expense.photo && (
                                <img src={expense.photo} alt="" className="w-10 h-10 rounded object-cover" />
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-white">{expense.brand_name}</div>
                                <div className="text-gray-300 text-sm">{expense.food_name}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {expense.weight} {expense.serving_unit} • ${expense.pricePerUnit.toFixed(2)}/{expense.serving_unit}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  🔥 {expense.totalCalories} cal • {expense.totalProtein}g P • {expense.totalFat}g F • {expense.totalCarbs}g C
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-xl text-green-400">
                                  ${expense.cost.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(expense.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => editExpense(expense)}
                                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => deleteExpense(expense.id)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
  );
};

export default FoodFinanceDashboard;