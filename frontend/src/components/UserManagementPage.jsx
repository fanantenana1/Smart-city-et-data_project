import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Edit, Trash2, Check, X, Eye, User, Settings, UserPlus } from 'lucide-react';
import { fetchUsers, fetchBins, approveUser as apiApproveUser, rejectUser as apiRejectUser, updateUser, deleteUser as apiDeleteUser, fetchUserBins, assignBinToUser, unassignBinFromUser as apiUnassignBinFromUser } from '../api';
const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewingUser, setViewingUser] = useState(null);
  const [allBins, setAllBins] = useState([]);
  const [managingBinsUser, setManagingBinsUser] = useState(null);
  // ✅ NOUVEAUX ÉTATS pour la création d'utilisateur
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone_number: '',
    role: 'simple_user',
    profile_image: null
  });
  useEffect(() => {
    loadUsers();
    loadBins();
  }, []);
  const loadUsers = async () => {
    try {
      const response = await fetchUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };
  const loadBins = async () => {
    try {
      const response = await fetchBins();
      setAllBins(response.data || []);
    } catch (err) {
      console.error('Erreur chargement poubelles:', err);
    }
  };
  // ✅ NOUVELLE FONCTION : Ouvrir le modal de création
  const openCreateModal = () => {
    setShowCreateModal(true);
    setCreateForm({
      username: '',
      password: '',
      full_name: '',
      email: '',
      phone_number: '',
      role: 'simple_user',
      profile_image: null
    });
  };
  // ✅ NOUVELLE FONCTION : Fermer le modal de création
  const cancelCreate = () => {
    setShowCreateModal(false);
    setCreateForm({
      username: '',
      password: '',
      full_name: '',
      email: '',
      phone_number: '',
      role: 'simple_user',
      profile_image: null
    });
  };
  // ✅ NOUVELLE FONCTION : Créer un nouvel utilisateur
  const handleCreateUser = async () => {
    // Validation
    if (!createForm.username || !createForm.password) {
      alert('Le nom d\'utilisateur et le mot de passe sont obligatoires');
      return;
    }
    if (!createForm.email) {
      alert('L\'email est obligatoire');
      return;
    }
    // Vérifier si l'utilisateur existe déjà
    const existingUser = users.find(u => u.username === createForm.username);
    if (existingUser) {
      alert(`L'utilisateur "${createForm.username}" existe déjà`);
      return;
    }
    try {
      const token = localStorage.getItem('sw_token') || localStorage.getItem('token') || '';
      console.log('📤 handleCreateUser payload:', JSON.stringify({
        username: createForm.username,
        email: createForm.email,
        full_name: createForm.full_name,
        phone_number: createForm.phone_number,
        role: createForm.role,
        profile_image: createForm.profile_image
      }));
      const response = await fetch('http://localhost:8000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: createForm.username,
          password: createForm.password,
          email: createForm.email,
          full_name: createForm.full_name,
          phone_number: createForm.phone_number,
          role: createForm.role,
          profile_image: createForm.profile_image || null
        }),
      });
      if (response.ok) {
        setError('');
        alert(`Utilisateur ${createForm.username} créé avec succès !`);
        loadUsers();
        cancelCreate();
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.detail || 'Erreur lors de la création'}`);
      }
    } catch (err) {
      console.error('Erreur création utilisateur:', err);
      setError('Erreur lors de la création de l\'utilisateur');
      alert('Erreur réseau lors de la création');
    }
  };
  const handleApproveUser = async (username) => {
    if (!window.confirm(`Approuver l'utilisateur ${username} ? Il pourra se connecter après approbation.`)) {
      return;
    }
    try {
      await apiApproveUser(username);
      setError('');
      alert(`Utilisateur ${username} approuvé avec succès !`);
      loadUsers();
    } catch (err) {
      console.error('Erreur approbation:', err);
      setError('Erreur lors de l\'approbation');
    }
  };
  const handleRejectUser = async (username) => {
    if (!window.confirm(`Rejeter l'utilisateur ${username} ? Il ne pourra pas se connecter.`)) {
      return;
    }
    try {
      await apiRejectUser(username);
      setError('');
      alert(`Utilisateur ${username} rejeté.`);
      loadUsers();
    } catch (err) {
      console.error('Erreur rejet:', err);
      setError('Erreur lors du rejet');
    }
  };
  const handleDeleteUser = async (username) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur ${username} ?`)) {
      return;
    }
    try {
      await apiDeleteUser(username);
      setError('');
      alert(`Utilisateur ${username} supprimé.`);
      loadUsers();
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };
  const openEditModal = (user) => {
    setEditingUser(user.username);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      role: user.role || 'simple_user',
      profile_image: user.profile_image || null
    });
  };
  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };
  const saveEdit = async () => {
    try {
      console.log('📤 saveEdit payload:', JSON.stringify(editForm));
      await updateUser(editingUser, editForm);
      setError('');
      alert('Utilisateur modifié avec succès !');
      loadUsers();
      cancelEdit();
    } catch (err) {
      console.error('Erreur modification:', err);
      console.error('Response:', err.response?.data);
      setError('Erreur lors de la modification');
    }
  };
  const openBinManagement = (user) => {
    setManagingBinsUser(user);
  };
  const getAvailableBins = (user) => {
    const allAssignedBinIds = [];
    users.forEach(u => {
      if (u.assigned_bins && Array.isArray(u.assigned_bins)) {
        allAssignedBinIds.push(...u.assigned_bins);
      }
    });
    return allBins.filter(bin => !allAssignedBinIds.includes(bin.bin_id));
  };
  const getAssignedBins = (user) => {
    const assignedBinIds = user.assigned_bins || [];
    return allBins.filter(bin => assignedBinIds.includes(bin.bin_id));
  };
  const handleAssignBin = async (username, binId) => {
    try {
      await assignBinToUser(username, binId);
      setError('');
      alert(`Poubelle ${binId} assignée à ${username}`);
      loadUsers();
    } catch (err) {
      console.error('Erreur assignation:', err);
      setError('Erreur lors de l\'assignation');
    }
  };
  const handleUnassignBin = async (username, binId) => {
    if (!window.confirm(`Retirer la poubelle ${binId} de ${username} ?`)) {
      return;
    }
    try {
      await apiUnassignBinFromUser(username, binId);
      setError('');
      alert(`Poubelle ${binId} retirée de ${username}`);
      loadUsers();
    } catch (err) {
      console.error('Erreur désassignation:', err);
      setError('Erreur lors de la désassignation');
    }
  };
  const getStatusBadge = (user) => {
    if (!user.is_approved) {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">⏳ En attente d'approbation</span>;
    }
    if (!user.is_active) {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">❌ Rejeté</span>;
    }
    return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✅ Approuvé</span>;
  };
  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: '👑 Admin' },
      operator: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🚛 Opérateur' },
      collector: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🚛 Collecteur' },
      simple_user: { bg: 'bg-gray-100', text: 'text-gray-800', label: '👤 Utilisateur' }
    };
    const badge = badges[role] || badges.simple_user;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* En-tête avec bouton d'ajout */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestion des Utilisateurs</h2>
          <p className="text-gray-600 mt-1">Gérez les comptes utilisateurs et leurs permissions</p>
        </div>
        {/* ✅ NOUVEAU BOUTON : Ajouter un utilisateur */}
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all shadow-md transform hover:scale-105 font-semibold"
        >
          <UserPlus size={20} />
          <span>Ajouter un utilisateur</span>
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-800">{users.length}</p>
            </div>
            <Users className="text-gray-400" size={32} />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Approuvés</p>
              <p className="text-2xl font-bold text-green-800">
                {users.filter(u => u.is_approved && u.is_active).length}
              </p>
            </div>
            <UserCheck className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">En attente</p>
              <p className="text-2xl font-bold text-yellow-800">
                {users.filter(u => !u.is_approved).length}
              </p>
            </div>
            <Settings className="text-yellow-600" size={32} />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Rejetés</p>
              <p className="text-2xl font-bold text-red-800">
                {users.filter(u => !u.is_active && u.is_approved !== true).length}
              </p>
            </div>
            <UserX className="text-red-600" size={32} />
          </div>
        </div>
      </div>
      {/* Tableau des utilisateurs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Poubelles
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.username} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.profile_image ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={user.profile_image}
                            alt={user.full_name || user.username}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User size={20} className="text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || user.username}
                        </div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone_number || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => openBinManagement(user)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {user.assigned_bins?.length || 0} poubelle(s)
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center space-x-1">
                      {!user.is_approved && (
                        <>
                          <button
                            onClick={() => handleApproveUser(user.username)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded transition"
                            title="Approuver"
                          >
                            <UserCheck size={18} />
                          </button>
                          <button
                            onClick={() => handleRejectUser(user.username)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                            title="Rejeter"
                          >
                            <UserX size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setViewingUser(user)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded transition"
                        title="Voir détails"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openBinManagement(user)}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded transition"
                        title="Gérer poubelles assignées"
                      >
                        <Settings size={18} />
                      </button>                      
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded transition"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.username)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>
      {/* ✅ NOUVEAU MODAL : Créer un utilisateur */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                  <UserPlus className="text-emerald-500" size={28} />
                  <span>Créer un nouvel utilisateur</span>
                </h3>
                <button
                  onClick={cancelCreate}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                {/* Photo de profil */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Photo de profil (optionnel)</label>
                  <div className="flex items-center space-x-4">
                    {/* Miniature */}
                    <div className="relative flex-shrink-0">
                      {createForm.profile_image ? (
                        <img
                          src={createForm.profile_image}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-emerald-400"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                          <User size={32} className="text-gray-600" />
                        </div>
                      )}
                      {createForm.profile_image && (
                        <button
                          type="button"
                          onClick={() => setCreateForm({...createForm, profile_image: null})}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
                          title="Effacer l'image"
                        >✕</button>
                      )}
                    </div>
                    {/* Inputs */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Option 1 : Parcourir un fichier</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setCreateForm(prev => ({...prev, profile_image: reader.result}));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-sm border rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Option 2 : URL de l'image</label>
                        <input
                          type="text"
                          value={
                            createForm.profile_image && typeof createForm.profile_image === 'string' && !createForm.profile_image.startsWith('data:')
                              ? createForm.profile_image
                              : ''
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setCreateForm(prev => ({...prev, profile_image: val || null}));
                          }}
                          className="w-full border rounded px-3 py-2 text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Nom d'utilisateur */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Nom d'utilisateur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="nom_utilisateur"
                    required
                  />
                </div>
                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {/* Nom complet */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Nom complet</label>
                  <input
                    type="text"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({...createForm, full_name: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Jean Dupont"
                  />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={createForm.phone_number}
                    onChange={(e) => setCreateForm({...createForm, phone_number: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="+261 34 00 000 00"
                  />
                </div>
                {/* Rôle */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Rôle</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="simple_user">👤 Utilisateur Simple</option>
                    <option value="operator">🚛 Opérateur</option>
                    <option value="collector">🚛 Collecteur</option>
                    <option value="admin">👑 Administrateur</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={cancelCreate}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-semibold flex items-center space-x-2"
                >
                  <UserPlus size={18} />
                  <span>Créer l'utilisateur</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal détails utilisateur */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Détails de l'utilisateur</h3>
                <button
                  onClick={() => setViewingUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 pb-4 border-b">
                  {viewingUser.profile_image ? (
                    <img
                      src={viewingUser.profile_image}
                      alt={viewingUser.full_name || viewingUser.username}
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <User size={32} className="text-gray-600" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-bold">{viewingUser.full_name || viewingUser.username}</h4>
                    <p className="text-gray-600">@{viewingUser.username}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{viewingUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="font-semibold">{viewingUser.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rôle</p>
                    <div className="mt-1">{getRoleBadge(viewingUser.role)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <div className="mt-1">{getStatusBadge(viewingUser)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date de création</p>
                    <p className="font-semibold">{viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleDateString('fr-FR') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dernière connexion</p>
                    <p className="font-semibold">{viewingUser.last_login ? new Date(viewingUser.last_login).toLocaleDateString('fr-FR') : 'Jamais'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Poubelles assignées</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {viewingUser.assigned_bins && viewingUser.assigned_bins.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewingUser.assigned_bins.map(binId => (
                          <span key={binId} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                            {binId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">Aucune poubelle assignée</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setViewingUser(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal modification utilisateur */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Modifier l'utilisateur - {editingUser}</h3>
                <button
                  onClick={cancelEdit}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                {/* Photo de profil */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Photo de profil</label>
                  <div className="flex items-center space-x-4">
                    {/* Miniature */}
                    <div className="relative flex-shrink-0">
                      {editForm.profile_image ? (
                        <img
                          src={editForm.profile_image}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-emerald-400"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                          <User size={32} className="text-gray-600" />
                        </div>
                      )}
                      {editForm.profile_image && (
                        <button
                          type="button"
                          onClick={() => setEditForm({...editForm, profile_image: null})}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
                          title="Effacer l'image"
                        >✕</button>
                      )}
                    </div>
                    {/* Inputs */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Option 1 : Parcourir un fichier</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditForm(prev => ({...prev, profile_image: reader.result}));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-sm border rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Option 2 : URL de l'image</label>
                        <input
                          type="text"
                          value={
                            editForm.profile_image && typeof editForm.profile_image === 'string' && !editForm.profile_image.startsWith('data:')
                              ? editForm.profile_image
                              : ''
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForm(prev => ({...prev, profile_image: val || null}));
                          }}
                          className="w-full border rounded px-3 py-2 text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Nom complet */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Nom complet</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Nom complet"
                  />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Email"
                  />
                </div>
                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={editForm.phone_number}
                    onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Téléphone"
                  />
                </div>
                {/* Rôle */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Rôle</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="simple_user">👤 Utilisateur Simple</option>
                    <option value="operator">🚛 Opérateur</option>
                    <option value="collector">🚛 Collecteur</option>
                    <option value="admin">👑 Administrateur</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal gestion des poubelles */}
      {managingBinsUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">
                  Gestion des poubelles - {managingBinsUser.full_name || managingBinsUser.username}
                </h3>
                <button
                  onClick={() => setManagingBinsUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Poubelles assignées */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <Check className="mr-2 text-green-600" size={18} />
                    Poubelles assignées ({getAssignedBins(managingBinsUser).length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getAssignedBins(managingBinsUser).map((bin) => (
                      <div key={bin.bin_id} className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <p className="font-semibold text-green-800">{bin.bin_id}</p>
                          <p className="text-sm text-gray-600">{bin.location}</p>
                        </div>
                        <button
                          onClick={() => handleUnassignBin(managingBinsUser.username, bin.bin_id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                          title="Retirer"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                    {getAssignedBins(managingBinsUser).length === 0 && (
                      <p className="text-gray-500 text-sm italic p-4 text-center">Aucune poubelle assignée</p>
                    )}
                  </div>
                </div>
                {/* Poubelles disponibles */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <Users className="mr-2 text-blue-600" size={18} />
                    Poubelles disponibles ({getAvailableBins(managingBinsUser).length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getAvailableBins(managingBinsUser).map((bin) => (
                      <div key={bin.bin_id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition">
                        <div>
                          <p className="font-semibold text-gray-800">{bin.bin_id}</p>
                          <p className="text-sm text-gray-600">{bin.location}</p>
                        </div>
                        <button
                          onClick={() => handleAssignBin(managingBinsUser.username, bin.bin_id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded transition"
                          title="Assigner"
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    ))}
                    {getAvailableBins(managingBinsUser).length === 0 && (
                      <p className="text-gray-500 text-sm italic p-4 text-center">Toutes les poubelles sont assignées</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setManagingBinsUser(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserManagementPage;