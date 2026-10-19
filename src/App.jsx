import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import TasksView from './components/TasksView';
import ProductsCatalogView from './components/ProductsCatalogView';
import PricingView from './components/PricingView';
import GeneralReportView from './components/GeneralReportView';
import NewTaskModal from './components/NewTaskModal';
import ChecklistModal from './components/ChecklistModal';
import DopamineCelebrationModal from './components/DopamineCelebrationModal';
import CompletedTasksView from './components/CompletedTasksView';
import SettingsModal, { APP_THEMES } from './components/SettingsModal';
import { SheetsApi } from './services/sheetsApi';
import {
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_TASKS,
  INITIAL_PLATFORMS,
  DEFAULT_CHECKLIST_ITEMS
} from './data/initialData';

export default function App() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Carrega estado persistente do localStorage para não perder edições
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('taresk_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [platforms, setPlatforms] = useState(() => {
    const saved = localStorage.getItem('taresk_platforms');
    return saved ? JSON.parse(saved) : INITIAL_PLATFORMS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('taresk_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [products, setProducts] = useState(() => {
    const parseNum = (v) => {
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      if (!v) return 0;
      const s = String(v).replace(/[^0-9,-.]/g, '').trim();
      if (s.includes('.') && s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
      if (s.includes(',')) return parseFloat(s.replace(',', '.')) || 0;
      return parseFloat(s) || 0;
    };
    const saved = localStorage.getItem('taresk_products');
    if (!saved) return INITIAL_PRODUCTS;
    try {
      const list = JSON.parse(saved);
      if (Array.isArray(list)) {
        return list.map(p => ({
          ...p,
          cost: parseNum(p.cost),
          width: parseNum(p.width),
          length: parseNum(p.length),
          height: parseNum(p.height),
          weight: parseNum(p.weight)
        }));
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('taresk_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [completedTasks, setCompletedTasks] = useState(() => {
    const saved = localStorage.getItem('taresk_completed_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [appTheme, setAppTheme] = useState(() => {
    return localStorage.getItem('taresk_app_theme') || 'default';
  });

  // Lista padrão de checklist editável nas Configurações (Foto 2)
  const [defaultChecklist, setDefaultChecklist] = useState(() => {
    const saved = localStorage.getItem('taresk_default_checklist');
    return saved ? JSON.parse(saved) : DEFAULT_CHECKLIST_ITEMS;
  });

  // Aba ativa: 'tarefas', 'cadastro', 'precificadora', 'relatorio', 'tarefas_concluidas'
  const [activeTab, setActiveTab] = useState('tarefas');

  // Modais
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeChecklistTask, setActiveChecklistTask] = useState(null);
  const [celebratingTask, setCelebratingTask] = useState(null); // Tarefa em celebração dopaminérgica

  // Sincronização localStorage
  useEffect(() => {
    localStorage.setItem('taresk_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('taresk_platforms', JSON.stringify(platforms));
  }, [platforms]);

  useEffect(() => {
    localStorage.setItem('taresk_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('taresk_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('taresk_completed_tasks', JSON.stringify(completedTasks));
  }, [completedTasks]);

  useEffect(() => {
    localStorage.setItem('taresk_default_checklist', JSON.stringify(defaultChecklist));
  }, [defaultChecklist]);

  // Carrega e atualiza dados do Google Sheets
  const refreshFromSheets = useCallback(async (showIndicator = false) => {
    if (!SheetsApi.getUrl()) return;
    if (showIndicator) setIsSyncing(true);

    try {
      const data = await SheetsApi.fetchAllData();
      if (data) {
        if (Array.isArray(data.tasks)) {
          const sanitizedTasks = data.tasks.map(t => {
            let chk = t.checklist;
            let mp = t.marketplaces;
            if (typeof chk === 'string') {
              try { chk = JSON.parse(chk); } catch (e) { chk = []; }
            }
            if (!Array.isArray(chk) && typeof t.notes === 'string' && t.notes.startsWith('[')) {
              try { chk = JSON.parse(t.notes); } catch (e) { }
            }
            if (typeof mp === 'string') {
              try { mp = JSON.parse(mp); } catch (e) { mp = {}; }
            }
            return {
              ...t,
              checklist: Array.isArray(chk) ? chk : [],
              marketplaces: (mp && typeof mp === 'object') ? mp : {}
            };
          });
          setTasks(sanitizedTasks);
        }
        if (Array.isArray(data.completedTasks)) setCompletedTasks(data.completedTasks);
        if (Array.isArray(data.products) && data.products.length > 0) {
          const parseNum = (v) => {
            if (typeof v === 'number') return isNaN(v) ? 0 : v;
            if (!v) return 0;
            const s = String(v).replace(/[^0-9,-.]/g, '').trim();
            if (s.includes('.') && s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
            if (s.includes(',')) return parseFloat(s.replace(',', '.')) || 0;
            return parseFloat(s) || 0;
          };

          const sanitizedProducts = data.products.map(p => ({
            ...p,
            cost: parseNum(p.cost),
            width: parseNum(p.width),
            length: parseNum(p.length),
            height: parseNum(p.height),
            weight: parseNum(p.weight)
          }));
          setProducts(sanitizedProducts);
        }
        if (Array.isArray(data.users) && data.users.length > 0) setUsers(data.users);
        if (Array.isArray(data.platforms) && data.platforms.length > 0) setPlatforms(data.platforms);
        setLastSyncTime(new Date());
      }
    } catch (e) {
      console.warn('Erro ao atualizar do Sheets:', e);
    } finally {
      if (showIndicator) setIsSyncing(false);
    }
  }, []);

  // Polling automático a cada 10 segundos para refletir qualquer edição feita na Planilha imediatamente
  useEffect(() => {
    refreshFromSheets(true);
    const interval = setInterval(() => {
      refreshFromSheets(false);
    }, 10000); // 10 segundos
    return () => clearInterval(interval);
  }, [refreshFromSheets]);

  // Handlers de Autenticação
  const handleLogin = (user) => {
    setCurrentUser(user);
    setActiveTab('tarefas');
    refreshFromSheets(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Handlers de Tarefas com Sincronização Imediata
  const handleCreateTask = (newTask) => {
    setTasks([newTask, ...tasks]);
    SheetsApi.syncTask(newTask);
  };

  const handleToggleMarketplace = (taskId, channelKey, btnType) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const currentChannel = t.marketplaces?.[channelKey] || { u: false, o: false, active: false };
        const updatedChannel = {
          ...currentChannel,
          [btnType]: !currentChannel[btnType]
        };
        updatedChannel.active = updatedChannel.u && updatedChannel.o;
        updatedChannel.status = updatedChannel.active ? 'published' : 'pending';

        const updatedTask = {
          ...t,
          marketplaces: {
            ...t.marketplaces,
            [channelKey]: updatedChannel
          }
        };
        SheetsApi.syncTask(updatedTask);
        return updatedTask;
      }
      return t;
    }));
  };

  const handleToggleChecklistItem = (taskId, itemId) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const updatedChecklist = t.checklist.map(item => {
          if (item.id === itemId) {
            return { ...item, completed: !item.completed };
          }
          return item;
        });

        const updatedTask = { ...t, checklist: updatedChecklist };
        if (activeChecklistTask && activeChecklistTask.id === taskId) {
          setActiveChecklistTask(updatedTask);
        }
        SheetsApi.syncTask(updatedTask);
        return updatedTask;
      }
      return t;
    }));
  };

  const handleAddChecklistItem = (taskId, label) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const newItem = {
          id: `item_${Date.now()}`,
          label,
          completed: false
        };
        const updatedTask = {
          ...t,
          checklist: [...(t.checklist || []), newItem]
        };
        if (activeChecklistTask && activeChecklistTask.id === taskId) {
          setActiveChecklistTask(updatedTask);
        }
        SheetsApi.syncTask(updatedTask);
        return updatedTask;
      }
      return t;
    }));
  };

  const handleReassignTask = (taskId, newAssigneeId) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, assignedTo: newAssigneeId };
        SheetsApi.syncTask(updated);
        return updated;
      }
      return t;
    }));
  };

  // Handlers para Editar e Excluir Tarefas Ativas
  const handleUpdateTask = (id, updatedFields) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updatedFields };
        SheetsApi.syncTask(updated);
        return updated;
      }
      return t;
    }));
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    SheetsApi.deleteTask(id);
  };

  // Handlers para Tarefas Finalizadas / Concluídas
  const handleFinishTask = (taskToFinish) => {
    const now = new Date();
    const completedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const finishedTask = {
      ...taskToFinish,
      status: 'completed',
      completedAt: completedDate,
      finishedTimestamp: Date.now()
    };

    setTasks(tasks.filter(t => t.id !== taskToFinish.id));
    setCompletedTasks([finishedTask, ...completedTasks]);
    setCelebratingTask(finishedTask);

    SheetsApi.finishTask(finishedTask);
  };

  const handleUnfinishTask = (taskToReactivate) => {
    const reactivated = {
      ...taskToReactivate,
      status: 'in_progress',
      completedAt: null
    };

    setCompletedTasks(completedTasks.filter(t => t.id !== taskToReactivate.id));
    setTasks([reactivated, ...tasks]);

    SheetsApi.unfinishTask(reactivated);
  };

  const handleDeleteCompletedTask = (id) => {
    setCompletedTasks(completedTasks.filter(t => t.id !== id));
    SheetsApi.deleteCompletedTask(id);
  };

  const handleUpdateCompletedTask = (id, updatedFields) => {
    setCompletedTasks(completedTasks.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updatedFields };
        SheetsApi.syncCompletedTask(updated);
        return updated;
      }
      return t;
    }));
  };

  // Handlers de Produtos
  const handleAddProduct = (newProd) => {
    setProducts([...products, newProd]);
    SheetsApi.syncProduct(newProd);
  };

  const handleUpdateProduct = (id, updatedProd) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updatedProd };
        SheetsApi.syncProduct(updated);
        return updated;
      }
      return p;
    }));
  };

  const handleDeleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
    SheetsApi.deleteProduct(id);
  };

  // Handler de Usuários (adicionar, editar, excluir)
  const handleAddUser = (newUser) => {
    setUsers([...users, newUser]);
    SheetsApi.syncUser(newUser);
  };

  const handleUpdateUser = (id, updatedFields) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...updatedFields };
        SheetsApi.syncUser(updated);
        return updated;
      }
      return u;
    }));
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updatedFields }));
    }
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
    SheetsApi.deleteUser(id);
  };

  // Handlers de Plataformas (adicionar, editar, excluir)
  const handleAddPlatform = (newPlat) => {
    setPlatforms([...platforms, newPlat]);
    SheetsApi.syncPlatform(newPlat);
  };

  const handleUpdatePlatform = (id, updatedFields) => {
    setPlatforms(platforms.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updatedFields };
        SheetsApi.syncPlatform(updated);
        return updated;
      }
      return p;
    }));
  };

  const handleDeletePlatform = (id) => {
    setPlatforms(platforms.filter(p => p.id !== id));
    SheetsApi.deletePlatform(id);
  };

  // Se não estiver logado, exibe a tela de login idêntica à Página 1 do PDF
  if (!currentUser) {
    return (
      <>
        <LoginScreen
          onLogin={handleLogin}
          users={users}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          isSyncing={isSyncing}
          onSync={() => refreshFromSheets(true)}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => {
            setIsSettingsModalOpen(false);
            refreshFromSheets(true);
          }}
          currentTheme={appTheme}
          onSelectTheme={(thId) => {
            setAppTheme(thId);
            localStorage.setItem('taresk_app_theme', thId);
          }}
          defaultChecklistItems={defaultChecklist}
          onUpdateDefaultChecklist={setDefaultChecklist}
        />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Header com Abas e Perfil */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onSync={refreshFromSheets}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
      />

      {/* Conteúdo Principal de acordo com a Aba Ativa */}
      <main style={{ flex: 1 }}>
        {activeTab === 'tarefas' && (
          <TasksView
            tasks={tasks}
            users={users}
            products={products}
            currentUser={currentUser}
            onOpenChecklistModal={(task) => setActiveChecklistTask(task)}
            onToggleMarketplace={handleToggleMarketplace}
            onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
            onFinishTask={handleFinishTask}
            onToggleChecklistItem={handleToggleChecklistItem}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'tarefas_concluidas' && (
          <CompletedTasksView
            completedTasks={completedTasks}
            users={users}
            products={products}
            currentUser={currentUser}
            onOpenChecklistModal={(task) => setActiveChecklistTask(task)}
            onUnfinishTask={handleUnfinishTask}
            onDeleteCompletedTask={handleDeleteCompletedTask}
            onUpdateCompletedTask={handleUpdateCompletedTask}
            onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'cadastro' && (
          <ProductsCatalogView
            products={products}
            tasks={tasks}
            currentUser={currentUser}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            users={users}
            platforms={platforms}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onAddPlatform={handleAddPlatform}
            onUpdatePlatform={handleUpdatePlatform}
            onDeletePlatform={handleDeletePlatform}
          />
        )}

        {activeTab === 'precificadora' && (
          <PricingView products={products} />
        )}

        {activeTab === 'relatorio' && currentUser.role === 'premium_admin' && (
          <GeneralReportView
            tasks={tasks}
            users={users}
            onOpenChecklistModal={(task) => setActiveChecklistTask(task)}
            onReassignTask={handleReassignTask}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* Modais da Aplicação */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        products={products}
        users={users}
        currentUser={currentUser}
        onCreateTask={handleCreateTask}
        defaultChecklistItems={defaultChecklist}
      />

      <ChecklistModal
        isOpen={!!activeChecklistTask}
        onClose={() => setActiveChecklistTask(null)}
        task={activeChecklistTask}
        onToggleChecklistItem={handleToggleChecklistItem}
        onAddChecklistItem={handleAddChecklistItem}
      />

      <DopamineCelebrationModal
        isOpen={!!celebratingTask}
        onClose={() => setCelebratingTask(null)}
        taskTitle={celebratingTask?.title}
        assigneeName={users.find(u => u.id === celebratingTask?.assignedTo)?.name}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentTheme={appTheme}
        onSelectTheme={(thId) => {
          setAppTheme(thId);
          localStorage.setItem('taresk_app_theme', thId);
        }}
        defaultChecklistItems={defaultChecklist}
        onUpdateDefaultChecklist={(updatedList) => {
          setDefaultChecklist(updatedList);
        }}
      />
    </div>
  );
}
