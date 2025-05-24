import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, TrendingUp, DollarSign, ShoppingCart, Calendar, Trash2, Edit3, Loader2, AlertCircle, Info, ListFilter, Wheat, ChefHat, Flame } from 'lucide-react'; // Flame icon added here
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

// IMPORTANT: Replace with your actual backend API URL
const YOUR_BACKEND_API_URL = '/api/nutritionix'; // Example: 'https://your-backend.com/api/nutritionix'

const FoodFinanceDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // For initial load

  // --- API Interaction ---
  const fetchFromBackend = useCallback(async (endpoint, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${YOUR_BACKEND_API_URL}/${endpoint}?${queryParams}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (e) {
      console.error(`Error fetching from backend endpoint ${endpoint}:`, e);
      setError(`Failed to fetch data for ${endpoint}. Please ensure your backend is running and API keys are correctly configured. Error: ${e.message}`);
      return null;
    }
  }, []);

  const searchProducts = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setError(null);
    const data = await fetchFromBackend('search', { query });
    if (data && data.common) { // Assuming Nutritionix common foods endpoint structure
      // Adapt this based on your backend's response structure from Nutritionix
      // We want multiple results, so 'data.common' might be an array
      const adaptedResults = data.common.map(item => ({
        food_name: item.food_name,
        brand_name: item.brand_name || 'Common', // Nutritionix common foods might not have brand
        type: 'common', // or 'branded' if applicable
        // Placeholder for common units - your backend should fetch and structure this.
        // This is crucial for the unit conversion and nutrition calculation.
        // Example structure: { unit: 'g', multiplier_to_serving_weight: 1, typical_sizes: ['100g'] }
        // For now, using a basic placeholder if not provided by API in simple search
        common_units: item.serving_unit ? [{ unit: item.serving_unit, multiplier_to_serving_weight: 1, typical_sizes: [item.serving_qty ? `${item.serving_qty} ${item.serving_unit}` : `1 ${item.serving_unit}`] }] : [{ unit: 'serving', multiplier_to_serving_weight: 1, typical_sizes: ['1 serving']}],
        serving_qty: item.serving_qty,
        serving_unit: item.serving_unit,
        serving_weight_grams: item.serving_weight_grams,
        nf_calories: item.nf_calories,
        nf_protein: item.nf_protein,
        nf_total_fat: item.nf_total_fat,
        nf_total_carbohydrate: item.nf_total_carbohydrate,
        // Add any other relevant fields from Nutritionix API
        // e.g., photo: item.photo ? item.photo.thumb : null
      }));
      setSearchResults(adaptedResults);
    } else {
      setSearchResults([]);
      if (data === null && !error) setError("No results found or backend error."); // Only set if fetchFromBackend didn't already set an error
    }
    setIsSearching(false);
  }, [fetchFromBackend, error]);


  // --- Effects ---
  useEffect(() => {
    setIsLoading(true);
    const savedExpenses = localStorage.getItem('foodExpenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) { // Only save if not initial loading
      localStorage.setItem('foodExpenses', JSON.stringify(expenses));
    }
  }, [expenses, isLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm && !selectedProduct && searchTerm.length > 2) {
        searchProducts(searchTerm);
        setShowSuggestions(true);
      } else if (!searchTerm) {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 500); // Increased debounce time

    return () => clearTimeout(timer);
  }, [searchTerm, selectedProduct, searchProducts]);

  useEffect(() => {
    if (selectedProduct && selectedProduct.common_units && selectedProduct.common_units.length > 0) {
      setSelectedUnit(selectedProduct.common_units[0].unit);
    } else if (selectedProduct && selectedProduct.serving_unit) {
      // Fallback if common_units isn't well-defined yet
      setSelectedUnit(selectedProduct.serving_unit);
    } else {
      setSelectedUnit('');
    }
  }, [selectedProduct]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // --- Calculations ---
  const calculateNutrition = useCallback((product, amount, unit) => {
    if (!product || !amount || !unit || !product.common_units || product.common_units.length === 0) {
        // Fallback to per serving if common_units is not defined, assuming amount is in servings
        if (product && product.serving_weight_grams && product.nf_calories && amount) {
             const multiplier = amount; // Assuming 'amount' is number of servings
             return {
                calories: Math.round(product.nf_calories * multiplier),
                protein: Math.round((product.nf_protein || 0) * multiplier),
                fat: Math.round((product.nf_total_fat || 0) * multiplier),
                carbs: Math.round((product.nf_total_carbohydrate || 0) * multiplier),
            };
        }
        return null;
    }

    // This part requires your backend to provide 'common_units' with a clear multiplier
    // to a base nutritional unit (e.g., 100g or serving_weight_grams).
    // The multiplier_to_serving_weight should convert the selected 'unit' to the base unit used for nf_values.
    // Example: if nf_values are per 100g, and unit is 'lb', multiplier needs to be 453.592 / 100.
    // For now, let's assume nf_values are per 'serving_unit' and common_units provide a multiplier to that.

    const unitInfo = product.common_units.find(u => u.unit === unit);
    if (!unitInfo || typeof unitInfo.multiplier_to_serving_weight === 'undefined') {
        // Attempt fallback if direct multiplier not present but serving_unit matches
        if (unit === product.serving_unit && product.nf_calories) {
            const multiplier = amount; // Assuming 'amount' is number of product.serving_unit
            return {
                calories: Math.round(product.nf_calories * multiplier),
                protein: Math.round((product.nf_protein || 0) * multiplier),
                fat: Math.round((product.nf_total_fat || 0) * multiplier),
                carbs: Math.round((product.nf_total_carbohydrate || 0) * multiplier),
            };
        }
        console.warn("Unit info or multiplier not found for nutrition calculation:", unit, product.common_units);
        setError(`Cannot calculate nutrition: unit "${unit}" not well-defined for ${product.food_name}.`);
        return null;
    }
    
    const totalAmountInServingUnits = parseFloat(amount) * unitInfo.multiplier_to_serving_weight;

    return {
      calories: Math.round(product.nf_calories * totalAmountInServingUnits),
      protein: Math.round((product.nf_protein || 0) * totalAmountInServingUnits),
      fat: Math.round((product.nf_total_fat || 0) * totalAmountInServingUnits),
      carbs: Math.round((product.nf_total_carbohydrate || 0) * totalAmountInServingUnits)
    };
  }, []);

  const analytics = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + exp.cost, 0);
    const avgPerItem = expenses.length ? total / expenses.length : 0;
    
    const totalCalories = expenses.reduce((sum, exp) => sum + (exp.totalCalories || 0), 0);
    const totalProtein = expenses.reduce((sum, exp) => sum + (exp.totalProtein || 0), 0);
    const totalFat = expenses.reduce((sum, exp) => sum + (exp.totalFat || 0), 0);
    const totalCarbs = expenses.reduce((sum, exp) => sum + (exp.totalCarbs || 0), 0);
        
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
      acc[date].calories += exp.totalCalories || 0;
      acc[date].protein += exp.totalProtein || 0;
      acc[date].fat += exp.totalFat || 0;
      acc[date].carbs += exp.totalCarbs || 0;
      return acc;
    }, {});

    const sortedDates = Object.entries(dailyExpenses).sort((a, b) => new Date(a[0]) - new Date(b[0]));
    const last7Days = sortedDates.slice(-7);
    
    const chartData = last7Days.map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: amount,
      calories: dailyCalories[date]?.calories || 0
    }));

    const nutritionData = [
      { name: 'Protein', value: totalProtein, color: '#10b981' }, // emerald-500
      { name: 'Fat', value: totalFat, color: '#f59e0b' }, // amber-500
      { name: 'Carbs', value: totalCarbs, color: '#3b82f6' } // blue-500
    ].filter(d => d.value > 0);


    const pieData = Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: amount
    })).filter(d => d.value > 0);

    return { total, avgPerItem, categoryTotals, chartData, pieData, totalCalories, totalProtein, totalFat, totalCarbs, nutritionData };
  }, [expenses]);


  // --- CRUD Operations ---
  const handleSubmit = () => {
    if (!selectedProduct || !quantity || !cost || !selectedUnit) {
      setError("Please select a product, and enter quantity, cost, and unit.");
      return;
    }
    
    const nutrition = calculateNutrition(selectedProduct, parseFloat(quantity), selectedUnit);
    if (!nutrition) {
      // Error already set by calculateNutrition if it fails
      return;
    }
    
    const expenseData = {
      food_name: selectedProduct.food_name,
      brand_name: selectedProduct.brand_name || 'N/A',
      category: selectedProduct.category || 'Groceries', // Default category
      serving_unit: selectedUnit,
      quantity: parseFloat(quantity),
      cost: parseFloat(cost),
      pricePerUnit: parseFloat(cost) / parseFloat(quantity),
      totalCalories: nutrition.calories,
      totalProtein: nutrition.protein,
      totalFat: nutrition.fat,
      totalCarbs: nutrition.carbs,
      date: new Date().toISOString()
    };

    if (editingId) {
      setExpenses(prev => prev.map(exp => exp.id === editingId ? { ...exp, ...expenseData } : exp));
    } else {
      setExpenses(prev => [{ id: Date.now(), ...expenseData }, ...prev]);
    }
    
    resetForm();
    setError(null);
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const editExpense = (expense) => {
    setEditingId(expense.id);
    // Reconstruct a basic product for editing; ideally, you'd fetch full product details again if needed
    setSelectedProduct({
      food_name: expense.food_name,
      brand_name: expense.brand_name,
      serving_unit: expense.serving_unit, // This will be the primary unit for now
      // You'd ideally re-fetch or have more detailed common_units stored
      common_units: expense.original_common_units || [{ unit: expense.serving_unit, multiplier_to_serving_weight: 1, typical_sizes: [`1 ${expense.serving_unit}`] }],
      nf_calories: expense.totalCalories / expense.quantity, // Approximate back-calculation
      nf_protein: expense.totalProtein / expense.quantity,
      nf_total_fat: expense.totalFat / expense.quantity,
      nf_total_carbohydrate: expense.totalCarbs / expense.quantity,
    });
    setQuantity(expense.quantity.toString());
    setCost(expense.cost.toString());
    setSelectedUnit(expense.serving_unit); // Set the unit that was used for this expense
    setSearchTerm(`${expense.brand_name || ''} ${expense.food_name}`.trim());
    setShowSuggestions(false);
  };

  const resetForm = () => {
    setSearchTerm('');
    setSelectedProduct(null);
    setQuantity('');
    setCost('');
    setShowSuggestions(false);
    setEditingId(null);
    setSearchResults([]);
    setSelectedUnit('');
    setError(null);
  };

  const handleProductSelect = (product) => {
    // Store the original common_units if you want to revert or show more options
    product.original_common_units = product.common_units;
    setSelectedProduct(product);
    setSearchTerm(`${product.brand_name || ''} ${product.food_name}`.trim());
    if (product.common_units && product.common_units.length > 0) {
      setSelectedUnit(product.common_units[0].unit);
    } else if (product.serving_unit) {
      setSelectedUnit(product.serving_unit);
    }
    setShowSuggestions(false);
    setSearchResults([]);
    setError(null);
  };
  
  const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#ef4444'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-16 w-16 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <div className="max-w-screen-xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="text-center mb-10 md:mb-16">
          <div className="inline-flex items-center gap-3 mb-3">
            <ChefHat className="h-10 w-10 text-sky-400" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              Food Finance Hub
            </h1>
          </div>
          <p className="text-lg text-slate-400">
            Intelligent tracking for your grocery expenses and nutritional intake.
          </p>
        </header>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-16">
          {[
            { title: 'Total Spent', value: `$${analytics.total.toFixed(2)}`, icon: DollarSign, color: 'text-green-400', bgColor: 'bg-green-500/10' },
            { title: 'Items Logged', value: expenses.length, icon: ShoppingCart, color: 'text-sky-400', bgColor: 'bg-sky-500/10' },
            { title: 'Total Calories', value: analytics.totalCalories.toLocaleString(), icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
            { title: 'Avg. Cost/Item', value: `$${analytics.avgPerItem.toFixed(2)}`, icon: TrendingUp, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
          ].map(stat => (
            <div key={stat.title} className={`p-5 rounded-xl shadow-lg ${stat.bgColor} border border-slate-700`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                  <p className="text-2xl md:text-3xl font-semibold text-slate-50">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 md:h-10 md:w-10 ${stat.color}`} />
              </div>
            </div>
          ))}
        </section>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-red-100">&times;</button>
          </div>
        )}

        {/* Main Content: Form and Lists/Charts */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form Section */}
          <section className="lg:col-span-1 bg-slate-800/50 p-6 rounded-xl shadow-xl border border-slate-700">
            <h2 className="text-2xl font-semibold text-slate-50 mb-6 flex items-center gap-2">
              <Edit3 className="h-6 w-6 text-sky-400" />
              {editingId ? 'Edit Expense' : 'Log New Expense'}
            </h2>
            
            {/* Search Input */}
            <div className="relative mb-4 search-container">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 h-5 w-5 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (selectedProduct && e.target.value !== `${selectedProduct.brand_name || ''} ${selectedProduct.food_name}`.trim()) {
                      setSelectedProduct(null);
                      setSelectedUnit(''); // Reset unit when product selection is cleared
                    }
                  }}
                  onFocus={() => {
                    if (!selectedProduct && searchTerm.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="Search food (e.g., apple, chicken breast)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sky-500 animate-spin" />}
              </div>
              
              {showSuggestions && searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                  {searchResults.map((product, index) => (
                    <div
                      key={`${product.food_name}-${index}`} // Add index if names can repeat
                      onClick={() => handleProductSelect(product)}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-700/70 border-b border-slate-700 last:border-b-0"
                    >
                      <div className="font-medium text-slate-100">{product.brand_name && product.brand_name !== "Common" ? product.brand_name + " " : ""}{product.food_name}</div>
                      <div className="text-xs text-slate-400">{product.serving_qty} {product.serving_unit} ({product.serving_weight_grams}g)</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedProduct && (
              <div className="mb-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                <p className="text-sm font-medium text-sky-400">{selectedProduct.brand_name || ''} {selectedProduct.food_name}</p>
                <p className="text-xs text-slate-400">
                  Serving: {selectedProduct.serving_qty || 1} {selectedProduct.serving_unit} ({selectedProduct.serving_weight_grams}g)
                </p>
                 <p className="text-xs text-slate-400">
                  Nutrition per serving: {selectedProduct.nf_calories || 0} cal
                  {typeof selectedProduct.nf_protein === 'number' ? `, ${selectedProduct.nf_protein}g P` : ''}
                  {typeof selectedProduct.nf_total_fat === 'number' ? `, ${selectedProduct.nf_total_fat}g F` : ''}
                  {typeof selectedProduct.nf_total_carbohydrate === 'number' ? `, ${selectedProduct.nf_total_carbohydrate}g C` : ''}
                </p>
              </div>
            )}

            {selectedProduct && selectedProduct.common_units && selectedProduct.common_units.length > 0 && (
              <div className="mb-4">
                <label htmlFor="unitSelect" className="block text-sm font-medium text-slate-300 mb-1">Unit</label>
                <select
                  id="unitSelect"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  {selectedProduct.common_units.map((u) => (
                    <option key={u.unit} value={u.unit}>
                      {u.unit} {u.typical_sizes && u.typical_sizes.length > 0 ? `(${u.typical_sizes[0]})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="quantityInput" className="block text-sm font-medium text-slate-300 mb-1">
                Quantity {selectedUnit && `(${selectedUnit})`}
              </label>
              <input
                id="quantityInput"
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={selectedUnit ? `e.g., 1.5` : "e.g., 1"}
                className="w-full px-3 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="costInput" className="block text-sm font-medium text-slate-300 mb-1">Total Cost ($)</label>
              <input
                id="costInput"
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g., 4.99"
                className="w-full px-3 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {quantity && cost && selectedProduct && selectedUnit && (
              <div className="mb-6 space-y-2">
                <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                  <p className="text-sm text-green-400">
                    Price per {selectedUnit}: ${(parseFloat(cost) / parseFloat(quantity)).toFixed(2)}
                  </p>
                </div>
                {(() => {
                  const nutrition = calculateNutrition(selectedProduct, parseFloat(quantity), selectedUnit);
                  return nutrition ? (
                    <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                      <p className="text-sm text-orange-400">Total Nutrition: {nutrition.calories} Cal</p>
                      <p className="text-xs text-slate-400">
                        {nutrition.protein}g P | {nutrition.fat}g F | {nutrition.carbs}g C
                      </p>
                    </div>
                  ) : <p className="text-xs text-red-400">Could not calculate nutrition for selected unit.</p>;
                })()}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!selectedProduct || !quantity || !cost || !selectedUnit || isSearching}
                className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="h-5 w-5" />
                {editingId ? 'Update Item' : 'Add Item'}
              </button>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="px-4 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </section>

          {/* Charts & Data Display Section */}
          <section className="lg:col-span-2 space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="bg-slate-800/50 p-4 md:p-6 rounded-xl shadow-xl border border-slate-700">
                <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-sky-400" /> Weekly Spending
                </h3>
                {analytics.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={analytics.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(tick) => tick.substring(0,5)} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(value) => `$${value.toFixed(0)}`} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(30,41,59,0.9)', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0' }} itemStyle={{color: '#e2e8f0'}} labelStyle={{ color: '#60a5fa' }} />
                      <Line type="monotone" dataKey="amount" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 4, fill: '#22d3ee', stroke: '#0f172a' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-sm h-[200px] flex items-center justify-center">No spending data for chart.</p>}
              </div>

              <div className="bg-slate-800/50 p-4 md:p-6 rounded-xl shadow-xl border border-slate-700">
                <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                  <Wheat className="h-5 w-5 text-amber-400" /> Macro Breakdown
                </h3>
                {analytics.nutritionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={analytics.nutritionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                        {analytics.nutritionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}g`, name]} contentStyle={{ backgroundColor: 'rgba(30,41,59,0.9)', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0' }} itemStyle={{color: '#e2e8f0'}} labelStyle={{ color: '#60a5fa' }}/>
                      <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-sm h-[200px] flex items-center justify-center">No nutrition data for chart.</p>}
              </div>
            </div>
            
            <div className="bg-slate-800/50 p-4 md:p-6 rounded-xl shadow-xl border border-slate-700">
                <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" /> Daily Calories
                </h3>
                {analytics.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(tick) => tick.substring(0,5)} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip formatter={(value) => [`${value} Cal`, 'Calories']} contentStyle={{ backgroundColor: 'rgba(30,41,59,0.9)', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0' }} itemStyle={{color: '#e2e8f0'}} labelStyle={{ color: '#60a5fa' }}/>
                      <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-sm h-[200px] flex items-center justify-center">No calorie data for chart.</p>}
              </div>


            {/* Purchase History List */}
            <div className="bg-slate-800/50 rounded-xl shadow-xl border border-slate-700">
              <div className="p-4 md:p-6 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <ListFilter className="h-5 w-5 text-sky-400" /> Purchase Log
                </h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {expenses.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <Info className="h-10 w-10 mx-auto mb-3 text-slate-500" />
                    <p>No expenses logged yet.</p>
                    <p className="text-sm">Add items using the form to see them here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="p-4 hover:bg-slate-700/30 group/item flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-100">{expense.brand_name || ''} {expense.food_name}</p>
                          <p className="text-sm text-slate-400">
                            {expense.quantity} {expense.serving_unit} - ${expense.cost.toFixed(2)}
                            <span className="text-xs text-slate-500 ml-2">({new Date(expense.date).toLocaleDateString()})</span>
                          </p>
                           <p className="text-xs text-amber-400">
                            {expense.totalCalories || 0} Cal | {expense.totalProtein || 0}g P | {expense.totalFat || 0}g F | {expense.totalCarbs || 0}g C
                           </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button
                            onClick={() => editExpense(expense)}
                            className="p-2 text-slate-400 hover:text-sky-400 rounded-md hover:bg-sky-500/10"
                            aria-label="Edit expense"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="p-2 text-slate-400 hover:text-red-400 rounded-md hover:bg-red-500/10"
                            aria-label="Delete expense"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default FoodFinanceDashboard;