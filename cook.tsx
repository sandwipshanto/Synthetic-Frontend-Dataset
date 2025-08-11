import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Clock, 
  Award, 
  Users, 
  Bookmark, 
  PlusCircle, 
  Utensils, 
  ChefHat, 
  ThumbsUp, 
  ThumbsDown,
  Search,
  GitFork,
  Send,
  Home,
  User,
  Calendar
} from 'lucide-react';
import { FaFire, FaLeaf, FaGlassWhiskey } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Mock data for our application
const recipes = [
  {
    id: 1,
    title: 'Creamy Garlic Pasta',
    author: 'ChefAlex',
    image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
    votes: 423,
    forks: 89,
    comments: 34,
    timePosted: '2 hours ago',
    ingredients: ['pasta', 'garlic', 'cream', 'parmesan', 'butter', 'salt', 'pepper'],
    swapSuggestions: [
      { ingredient: 'cream', suggestion: 'coconut milk', votes: 72, author: 'VeganCooker' },
      { ingredient: 'parmesan', suggestion: 'nutritional yeast', votes: 45, author: 'HealthySwaps' }
    ]
  },
  {
    id: 2,
    title: 'Thai Red Curry',
    author: 'SpiceQueen',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=1951&q=80',
    votes: 512,
    forks: 120,
    comments: 56,
    timePosted: '1 day ago',
    ingredients: ['coconut milk', 'red curry paste', 'chicken', 'bell peppers', 'bamboo shoots', 'fish sauce', 'basil'],
    swapSuggestions: [
      { ingredient: 'chicken', suggestion: 'tofu', votes: 98, author: 'TofuMaster' },
      { ingredient: 'fish sauce', suggestion: 'soy sauce', votes: 62, author: 'UmamiHunter' }
    ]
  },
  {
    id: 3,
    title: 'Chocolate Chip Cookies',
    author: 'BakingPro',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1900&q=80',
    votes: 837,
    forks: 256,
    comments: 104,
    timePosted: '3 days ago',
    ingredients: ['butter', 'sugar', 'brown sugar', 'eggs', 'vanilla', 'flour', 'baking soda', 'salt', 'chocolate chips'],
    swapSuggestions: [
      { ingredient: 'butter', suggestion: 'coconut oil', votes: 124, author: 'DairyFreeChef' },
      { ingredient: 'eggs', suggestion: 'flax eggs', votes: 87, author: 'VeganBaker' },
      { ingredient: 'flour', suggestion: 'almond flour', votes: 56, author: 'GlutenFreeGuru' }
    ]
  }
];

const liveSessions = [
  {
    id: 1,
    title: 'Italian Pasta Making Masterclass',
    host: 'ChefMario',
    startTime: '2:00 PM',
    participants: 54,
    image: 'https://images.unsplash.com/photo-1556760544-74068565f05c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
    status: 'live'
  },
  {
    id: 2,
    title: 'Sourdough Bread Workshop',
    host: 'BreadMaster',
    startTime: '5:30 PM',
    participants: 23,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
    status: 'upcoming'
  },
  {
    id: 3,
    title: 'Vegan Desserts For Everyone',
    host: 'SweetVegan',
    startTime: '7:00 PM',
    participants: 41,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
    status: 'upcoming'
  }
];

const discussions = [
  {
    id: 1,
    title: "What's your secret ingredient for chili?",
    author: 'ChiliLover',
    replies: 47,
    lastActivity: '15 minutes ago'
  },
  {
    id: 2,
    title: "Help! My sourdough starter isn't bubbling",
    author: 'BreadNewbie',
    replies: 28,
    lastActivity: '1 hour ago'
  },
  {
    id: 3,
    title: 'Best non-dairy milk for baking?',
    author: 'DairyFreeChef',
    replies: 63,
    lastActivity: '3 hours ago'
  }
];

const userVariants = [
  {
    id: 1,
    originalRecipe: 'Classic Beef Lasagna',
    yourVariant: 'Vegetarian Mushroom Lasagna',
    lastEdited: '2 days ago',
    image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
  },
  {
    id: 2,
    originalRecipe: 'Traditional Apple Pie',
    yourVariant: 'Low-sugar Apple & Berry Pie',
    lastEdited: '1 week ago',
    image: 'https://images.unsplash.com/photo-1562007908-17c67e878c6a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
  }
];

// Stat data for charts
const nutritionData = [
  { name: 'Protein', value: 25 },
  { name: 'Carbs', value: 45 },
  { name: 'Fat', value: 30 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const popularityData = [
  { name: 'Original', votes: 425 },
  { name: 'Your Variant', votes: 621 },
];

// Main Recipe App Component
const RecipeApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showLiveSessionDetail, setShowLiveSessionDetail] = useState(false);
  const [selectedLiveSession, setSelectedLiveSession] = useState<any>(null);

  const handleRecipeClick = (recipe: any) => {
    setSelectedRecipe(recipe);
    setShowRecipeDetail(true);
  };

  const handleLiveSessionClick = (session: any) => {
    setSelectedLiveSession(session);
    setShowLiveSessionDetail(true);
  };

  const handleForkRecipe = (recipe: any) => {
    alert(`Recipe "${recipe.title}" forked to your variants!`);
    // In a real app, we would add this to the user's variants
  };

  const renderFeed = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Community Feed</h2>
        <div className="flex items-center space-x-4">
          <button className="text-sm px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-100">Latest</button>
          <button className="text-sm px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-100">Most Popular</button>
          <button className="text-sm px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-100">Following</button>
        </div>
      </div>
      
      {recipes.map(recipe => (
        <motion.div 
          key={recipe.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <div className="md:flex">
            <div className="md:flex-shrink-0">
              <img 
                className="h-48 w-full object-cover md:w-48" 
                src={recipe.image} 
                alt={recipe.title} 
              />
            </div>
            <div className="p-6 w-full">
              <div className="flex justify-between items-start">
                <div>
                  <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold flex items-center">
                    {recipe.author} <span className="ml-2 text-xs text-gray-500">{recipe.timePosted}</span>
                  </div>
                  <a 
                    href="#" 
                    onClick={() => handleRecipeClick(recipe)}
                    className="block mt-1 text-lg leading-tight font-medium text-black hover:underline"
                  >
                    {recipe.title}
                  </a>
                  <p className="mt-2 text-sm text-gray-500">
                    {recipe.ingredients.slice(0, 4).join(', ')}
                    {recipe.ingredients.length > 4 ? `, and ${recipe.ingredients.length - 4} more...` : ''}
                  </p>
                </div>
                <button 
                  onClick={() => handleForkRecipe(recipe)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-orange-600 transition-colors"
                >
                  <GitFork size={16} className="mr-1" /> Fork
                </button>
              </div>
              
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Popular swaps:</div>
                <div className="space-y-2">
                  {recipe.swapSuggestions.map((swap, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div>
                        <span className="line-through text-gray-500">{swap.ingredient}</span>
                        <span className="mx-2">→</span>
                        <span className="font-medium">{swap.suggestion}</span>
                        <span className="text-xs text-gray-500 ml-2">by {swap.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ThumbsUp size={14} className="text-green-500" />
                        <span className="text-sm">{swap.votes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <div className="flex space-x-4">
                  <span className="flex items-center">
                    <Heart size={16} className="mr-1" />
                    {recipe.votes}
                  </span>
                  <span className="flex items-center">
                    <GitFork size={16} className="mr-1" />
                    {recipe.forks}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle size={16} className="mr-1" />
                    {recipe.comments}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button className="hover:text-indigo-500"><Bookmark size={16} /></button>
                  <button className="hover:text-indigo-500"><Share2 size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderMyVariants = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">My Recipe Variants</h2>
        <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-600 transition-colors">
          <PlusCircle size={16} className="mr-1" /> Create New
        </button>
      </div>
      
      {userVariants.map(variant => (
        <motion.div 
          key={variant.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <div className="md:flex">
            <div className="md:flex-shrink-0">
              <img 
                className="h-48 w-full object-cover md:w-48" 
                src={variant.image} 
                alt={variant.yourVariant} 
              />
            </div>
            <div className="p-6 flex-grow">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="text-sm text-gray-500">
                    Forked from <span className="text-indigo-500">{variant.originalRecipe}</span>
                  </div>
                  <a 
                    href="#" 
                    className="block mt-1 text-lg leading-tight font-medium text-black hover:underline"
                  >
                    {variant.yourVariant}
                  </a>
                  <p className="mt-2 text-sm text-gray-500">
                    Last edited {variant.lastEdited}
                  </p>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Popularity</h4>
                    <div className="h-32">
                      <BarChart width={200} height={100} data={popularityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="votes" fill="#8884d8" />
                      </BarChart>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Nutrition Profile</h4>
                    <div className="h-32 flex justify-center">
                      <PieChart width={100} height={100}>
                        <Pie
                          data={nutritionData}
                          cx={50}
                          cy={50}
                          innerRadius={20}
                          outerRadius={40}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {nutritionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end space-x-2">
                  <button className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition-colors text-sm">
                    Edit
                  </button>
                  <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm">
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderDiscussions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Recipe Discussions</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search discussions"
              className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
            <Search size={16} className="absolute left-2 top-3 text-gray-400" />
          </div>
          <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-600 transition-colors">
            <PlusCircle size={16} className="mr-1" /> New Topic
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-4">
            <button className="text-indigo-600 font-medium">All Topics</button>
            <button className="text-gray-500 hover:text-indigo-600">Cooking Help</button>
            <button className="text-gray-500 hover:text-indigo-600">Ingredient Swaps</button>
            <button className="text-gray-500 hover:text-indigo-600">Recipe Requests</button>
          </div>
        </div>
        
        <div>
          {discussions.map(discussion => (
            <motion.div 
              key={discussion.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="px-6 py-4 border-b border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-indigo-600 hover:text-indigo-800">
                    <a href="#">{discussion.title}</a>
                  </h3>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <User size={14} className="mr-1" /> {discussion.author}
                    <span className="mx-2">•</span>
                    <MessageCircle size={14} className="mr-1" /> {discussion.replies} replies
                    <span className="mx-2">•</span>
                    <Calendar size={14} className="mr-1" /> {discussion.lastActivity}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-indigo-500">
                    <Bookmark size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="px-6 py-4 bg-gray-50">
          <button className="w-full py-2 text-center text-indigo-600 hover:text-indigo-800 font-medium">
            Load More Discussions
          </button>
        </div>
      </div>
    </div>
  );

  const renderLiveSession = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Live Cook-Along Sessions</h2>
        <button className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-red-600 transition-colors">
          <PlusCircle size={16} className="mr-1" /> Host Session
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveSessions.map((session, idx) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            onClick={() => handleLiveSessionClick(session)}
          >
            <div className="relative">
              <img 
                className="w-full h-48 object-cover" 
                src={session.image} 
                alt={session.title} 
              />
              {session.status === 'live' && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 mr-1"></span>
                  LIVE NOW
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-medium mb-1">{session.title}</h3>
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <ChefHat size={14} className="mr-1" /> 
                Hosted by {session.host}
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm">
                  <Clock size={14} className="mr-1 text-gray-500" /> 
                  <span className={session.status === 'live' ? 'text-red-500 font-medium' : ''}>
                    {session.status === 'live' ? 'Happening now' : `Starts at ${session.startTime}`}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users size={14} className="mr-1" /> 
                  {session.participants}
                </div>
              </div>
              <button className={`mt-4 w-full py-2 rounded ${session.status === 'live' ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'} text-white transition-colors`}>
                {session.status === 'live' ? 'Join Now' : 'Set Reminder'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderRecipeDetail = () => {
    if (!selectedRecipe) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="relative">
            <img 
              src={selectedRecipe.image} 
              alt={selectedRecipe.title}
              className="w-full h-64 object-cover"
            />
            <button 
              onClick={() => setShowRecipeDetail(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-opacity-70"
            >
              ×
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent text-white">
              <h2 className="text-2xl font-bold">{selectedRecipe.title}</h2>
              <div className="flex items-center text-sm mt-1">
                <span>By {selectedRecipe.author}</span>
                <span className="mx-2">•</span>
                <span className="flex items-center">
                  <Heart size={14} className="mr-1" />
                  {selectedRecipe.votes}
                </span>
                <span className="mx-2">•</span>
                <span className="flex items-center">
                  <GitFork size={14} className="mr-1" />
                  {selectedRecipe.forks} forks
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Ingredients</h3>
              <button 
                onClick={() => handleForkRecipe(selectedRecipe)}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-orange-600 transition-colors"
              >
                <GitFork size={16} className="mr-1" /> Fork This Recipe
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="flex items-center">
                      <div className="w-1 h-1 bg-gray-500 rounded-full mr-2"></div>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Popular Ingredient Swaps</h3>
                  <div className="space-y-3">
                    {selectedRecipe.swapSuggestions.map((swap, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="line-through text-gray-500">{swap.ingredient}</span>
                            <span className="mx-2">→</span>
                            <span className="font-medium">{swap.suggestion}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button className="text-green-500 hover:text-green-600">
                              <ThumbsUp size={16} />
                            </button>
                            <span>{swap.votes}</span>
                            <button className="text-gray-400 hover:text-red-500">
                              <ThumbsDown size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Suggested by {swap.author}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        placeholder="Suggest your own swap..." 
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      />
                      <button className="bg-indigo-500 text-white px-4 rounded-lg hover:bg-indigo-600">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Community Comments</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    <div className="bg-white p-3 rounded border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">PastaMaster</span>
                        <span className="text-xs text-gray-500">10 min ago</span>
                      </div>
                      <p className="text-sm mt-1">I added a splash of white wine and it was amazing!</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">GarlicLover</span>
                        <span className="text-xs text-gray-500">1 hour ago</span>
                      </div>
                      <p className="text-sm mt-1">Double the garlic, always double the garlic!</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">NoviceCook</span>
                        <span className="text-xs text-gray-500">Yesterday</span>
                      </div>
                      <p className="text-sm mt-1">What temperature should the cream be? Mine curdled.</p>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="Add a comment..." 
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm"
                    />
                    <button className="bg-indigo-500 text-white px-4 rounded-lg hover:bg-indigo-600">
                      <Send size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-blue-700">Recipe Stats</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white p-2 rounded shadow-sm">
                      <div className="text-2xl font-bold text-blue-500">{selectedRecipe.votes}</div>
                      <div className="text-xs text-gray-500">Likes</div>
                    </div>
                    <div className="bg-white p-2 rounded shadow-sm">
                      <div className="text-2xl font-bold text-orange-500">{selectedRecipe.forks}</div>
                      <div className="text-xs text-gray-500">Forks</div>
                    </div>
                    <div className="bg-white p-2 rounded shadow-sm">
                      <div className="text-2xl font-bold text-purple-500">{selectedRecipe.comments}</div>
                      <div className="text-xs text-gray-500">Comments</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };
  
  const renderLiveSessionDetail = () => {
    if (!selectedLiveSession) return null;
    
    const fakeMessages = [
      { user: 'ChefMario', message: 'Welcome everyone! Today we are making authentic Italian pasta from scratch.', timestamp: '2:02 PM', reactions: ['👍', '❤️'] },
      { user: 'PastaLover', message: 'So excited to learn! Do we need a pasta machine?', timestamp: '2:03 PM', reactions: [] },
      { user: 'ChefMario', message: 'Great question! You can use a pasta machine if you have one, but I\'ll also show how to do it by hand.', timestamp: '2:04 PM', reactions: ['👍'] },
      { user: 'FlourPower', message: 'What type of flour are you using?', timestamp: '2:05 PM', reactions: [] },
      { user: 'ChefMario', message: 'I\'m using "00" flour, but all-purpose works too if that\'s what you have.', timestamp: '2:06 PM', reactions: ['🙏', '👌'] },
      { user: 'System', message: '⏰ COOKING STEP: Mix 2 cups of flour with 3 eggs in a bowl', timestamp: '2:08 PM', reactions: ['✅'] }
    ];
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-xl max-w-5xl w-full h-[80vh] flex flex-col"
        >
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between rounded-t-xl">
            <div className="flex items-center">
              <div className="relative mr-2">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </div>
              <h2 className="text-xl font-bold">{selectedLiveSession.title}</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Users size={16} className="mr-1" />
                <span>{selectedLiveSession.participants} watching</span>
              </div>
              <button 
                onClick={() => setShowLiveSessionDetail(false)}
                className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                Exit
              </button>
            </div>
          </div>
          
          <div className="flex flex-grow overflow-hidden">
            <div className="w-3/4 bg-gray-800 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src={selectedLiveSession.image} 
                  alt={selectedLiveSession.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                  <h3 className="text-white font-medium">
                    {selectedLiveSession.host} is demonstrating kneading techniques
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="w-1/4 flex flex-col bg-white border-l">
              <div className="flex-grow overflow-y-auto p-4">
                <h3 className="font-medium mb-4">Live Chat</h3>
                <div className="space-y-3">
                  {fakeMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`p-2 rounded ${msg.user === 'System' ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${msg.user === selectedLiveSession.host ? 'text-red-500' : msg.user === 'System' ? 'text-yellow-600' : ''}`}>
                          {msg.user}
                        </span>
                        <span className="text-xs text-gray-500">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm mt-1">{msg.message}</p>
                      {msg.reactions.length > 0 && (
                        <div className="mt-1 flex space-x-1">
                          {msg.reactions.map((reaction, ridx) => (
                            <span key={ridx} className="bg-white border text-xs px-1 rounded">
                              {reaction}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 border-t">
                <div className="flex mb-2">
                  <div className="flex space-x-1 overflow-x-auto">
                    {['👍', '❤️', '👏', '👋', '🔥', '🙌', '🙏', '😮', '🤔'].map(emoji => (
                      <button key={emoji} className="bg-gray-100 hover:bg-gray-200 text-sm px-2 py-1 rounded">
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Send a message..." 
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                  <button className="bg-indigo-500 text-white px-3 rounded-lg hover:bg-indigo-600">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Utensils size={24} className="text-orange-500 mr-2" />
              <span className="font-bold text-xl text-gray-800">RecipeForks</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-1">
              <button 
                onClick={() => setActiveTab('feed')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'feed' ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <Home size={16} className="inline mr-1" /> Feed
              </button>
              <button 
                onClick={() => setActiveTab('variants')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'variants' ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <GitFork size={16} className="inline mr-1" /> My Variants
              </button>
              <button 
                onClick={() => setActiveTab('discussions')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'discussions' ? 'bg-green-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <MessageCircle size={16} className="inline mr-1" /> Discussions
              </button>
              <button 
                onClick={() => setActiveTab('live')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'live' ? 'bg-red-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <div className="relative inline-block">
                  {activeTab !== 'live' && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                  <FaFire className="inline mr-1" />
                </div>
                Live Sessions
              </button>
            </div>
            
            <div className="flex items-center">
              <div className="relative mr-2">
                <input
                  type="text"
                  placeholder="Search recipes..."
                  className="pl-8 pr-2 py-1 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-200 focus:outline-none w-32 md:w-48"
                />
                <Search size={14} className="absolute left-2 top-1.5 text-gray-400" />
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                <User size={16} />
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-10">
        <div className="flex justify-around">
          <button 
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-3 flex flex-col items-center ${activeTab === 'feed' ? 'text-orange-500' : 'text-gray-500'}`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Feed</span>
          </button>
          <button 
            onClick={() => setActiveTab('variants')}
            className={`flex-1 py-3 flex flex-col items-center ${activeTab === 'variants' ? 'text-indigo-500' : 'text-gray-500'}`}
          >
            <GitFork size={20} />
            <span className="text-xs mt-1">My Variants</span>
          </button>
          <button 
            onClick={() => setActiveTab('discussions')}
            className={`flex-1 py-3 flex flex-col items-center ${activeTab === 'discussions' ? 'text-green-500' : 'text-gray-500'}`}
          >
            <MessageCircle size={20} />
            <span className="text-xs mt-1">Discussions</span>
          </button>
          <button 
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-3 flex flex-col items-center ${activeTab === 'live' ? 'text-red-500' : 'text-gray-500'}`}
          >
            <div className="relative">
              {activeTab !== 'live' && (
                <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500"></span>
              )}
              <FaFire size={20} />
            </div>
            <span className="text-xs mt-1">Live</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 mb-16 md:mb-0">
        {activeTab === 'feed' && renderFeed()}
        {activeTab === 'variants' && renderMyVariants()}
        {activeTab === 'discussions' && renderDiscussions()}
        {activeTab === 'live' && renderLiveSession()}
        {showRecipeDetail && renderRecipeDetail()}
        {showLiveSessionDetail && renderLiveSessionDetail()}
      </main>
    </div>
  );
};

export default RecipeApp;