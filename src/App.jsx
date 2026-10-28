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
import MobileAppView from './components/MobileAppView';
import AnnotationModal from './components/AnnotationModal';
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

  // Controle de exibição Mobile vs Desktop
  const checkIfMobile = () => {
    if (typeof window === 'undefined') return false;
    const isMobileHash = window.location.hash.toLowerCase().includes('mobile');
    if (isMobileHash) return true;
    const savedPref = localStorage.getItem('taresk_view_mode');
    if (savedPref === 'mobile') return true;
    if (savedPref === 'desktop') return false;
    
    // Detecção por largura de tela e userAgent (dispositivos móveis Android/iPhone)
    const isSmallScreen = window.innerWidth <= 900;
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isSmallScreen || isMobileUserAgent;
  };

  const [isMobileMode, setIsMobileMode] = useState(checkIfMobile);

  useEffect(() => {
    const handleResize = () => {
      const savedPref = localStorage.getItem('taresk_view_mode');
      if (!savedPref) {
        setIsMobileMode(checkIfMobile());
      }
    };

    const handleHashChange = () => {
      const isHashMobile = window.location.hash.toLowerCase().includes('mobile');
      if (isHashMobile) {
        setIsMobileMode(true);
        localStorage.setItem('taresk_view_mode', 'mobile');
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);


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
    try {
      const saved = localStorage.getItem('taresk_current_user');
      if (saved) return JSON.parse(saved);
      // Se não houver usuário salvo ainda (primeira vez ou mobile), inicializa com Allyson ou Master
      const defaultUser = INITIAL_USERS.find(u => u.name.toLowerCase().includes('allyson')) || INITIAL_USERS[0];
      if (defaultUser) {
        localStorage.setItem('taresk_current_user', JSON.stringify(defaultUser));
        return defaultUser;
      }
      return null;
    } catch (e) {
      return INITIAL_USERS[0] || null;
    }
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
    const saved = localStorage.getItem('taresk_app_theme');
    if (saved === 'dark') return 'dark';
    return 'light';
  });

  useEffect(() => {
    if (appTheme === 'dark') {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [appTheme]);

  // Lista padrão de checklist editável nas Configurações (Foto 2)
  const [defaultChecklist, setDefaultChecklist] = useState(() => {
    const saved = localStorage.getItem('taresk_default_checklist');
    return saved ? JSON.parse(saved) : DEFAULT_CHECKLIST_ITEMS;
  });

  // Modelos de Checklist sincronizados com a planilha
  const [checklistTemplates, setChecklistTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('taresk_checklist_templates');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Aba ativa: 'tarefas', 'cadastro', 'precificadora', 'relatorio', 'tarefas_concluidas'
  const [activeTab, setActiveTab] = useState('tarefas');

  // Modais
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
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

  useEffect(() => {
    localStorage.setItem('taresk_checklist_templates', JSON.stringify(checklistTemplates));
  }, [checklistTemplates]);

  // Rastreia timestamps das tarefas modificadas localmente recentemente para o polling não sobrescrever com dados antigos do Sheets
  const localTaskUpdatesRef = useRef({});

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

          // Mescla com tarefas locais que tenham atualizações muito recentes (últimos 15 segundos)
          setTasks(prevTasks => {
            const now = Date.now();
            return sanitizedTasks.map(incomingTask => {
              const localMatch = prevTasks.find(pt => 
                (pt.id && incomingTask.id && String(pt.id) === String(incomingTask.id)) ||
                (pt.sku && pt.sku === incomingTask.sku && pt.assignedTo === incomingTask.assignedTo)
              );
              const lastLocalUpdate = localMatch ? (localTaskUpdatesRef.current[localMatch.id] || localTaskUpdatesRef.current[String(localMatch.id)] || 0) : 0;
              // Se foi editado localmente há menos de 15 segundos, preserva o estado local mais recente
              if (localMatch && (now - lastLocalUpdate < 15000)) {
                return localMatch;
              }
              return incomingTask;
            });
          });
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
        if (Array.isArray(data.checklistTemplates) && data.checklistTemplates.length > 0) {
          setChecklistTemplates(data.checklistTemplates);
        }
        setLastSyncTime(new Date());
      }
    } catch (e) {
      console.warn('Erro ao atualizar do Sheets:', e);
    } finally {
      if (showIndicator) setIsSyncing(false);
    }
  }, []);

  // Carrega os dados da planilha uma única vez ao iniciar o aplicativo (sem ronda contínua)
  useEffect(() => {
    refreshFromSheets(true);
  }, [refreshFromSheets]);

  // Handlers de Autenticação
  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('taresk_current_user', JSON.stringify(user));
    }
    setActiveTab('tarefas');
    refreshFromSheets(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('taresk_current_user');
    setCurrentUser(null);
  };

  // Handlers de Tarefas com Sincronização Imediata
  const handleCreateTask = (newTask) => {
    localTaskUpdatesRef.current[newTask.id] = Date.now();
    setTasks(prev => [newTask, ...prev]);
    SheetsApi.syncTask(newTask);
  };

  const handleDuplicateTask = (taskToDuplicate) => {
    const newId = 'task_' + Date.now();
    localTaskUpdatesRef.current[newId] = Date.now();

    // Clona os checklists gerando novos ids para os itens
    const clonedChecklist = Array.isArray(taskToDuplicate.checklist)
      ? taskToDuplicate.checklist.map((item, idx) => ({
          ...item,
          id: `item_${Date.now()}_${idx}`,
          completed: false // inicia desmarcado para a nova tarefa duplicada
        }))
      : [];

    // Clona os marketplaces resetando o progresso para a nova tarefa
    const clonedMarketplaces = {};
    if (taskToDuplicate.marketplaces && typeof taskToDuplicate.marketplaces === 'object') {
      Object.keys(taskToDuplicate.marketplaces).forEach(key => {
        const orig = taskToDuplicate.marketplaces[key];
        clonedMarketplaces[key] = {
          ...orig,
          u: false,
          o: false,
          active: false,
          status: 'pending'
        };
      });
    }

    const duplicatedTask = {
      ...taskToDuplicate,
      id: newId,
      title: taskToDuplicate.title ? `${taskToDuplicate.title} (Cópia)` : 'Tarefa Copiada',
      status: 'in_progress',
      completedAt: null,
      finishedTimestamp: null,
      checklist: clonedChecklist,
      marketplaces: clonedMarketplaces,
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [duplicatedTask, ...prev]);
    SheetsApi.syncTask(duplicatedTask);
  };

  const handleToggleMarketplace = (taskId, channelKey, btnType) => {
    localTaskUpdatesRef.current[taskId] = Date.now();
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const currentChannel = t.marketplaces?.[channelKey] || { box: false, rocket: false, pie: false, u: false, o: false, p: false, active: false };
        const updatedVal = !currentChannel[btnType];
        
        // Mapeamento bidirecional retrocompatível:
        // box <-> u, rocket <-> o, pie <-> p
        const updatedChannel = {
          ...currentChannel,
          [btnType]: updatedVal
        };

        if (btnType === 'box' || btnType === 'u') {
          updatedChannel.box = updatedVal;
          updatedChannel.u = updatedVal;
        } else if (btnType === 'rocket' || btnType === 'o') {
          updatedChannel.rocket = updatedVal;
          updatedChannel.o = updatedVal;
        } else if (btnType === 'pie' || btnType === 'p') {
          updatedChannel.pie = updatedVal;
          updatedChannel.p = updatedVal;
        }

        const isBoxDone = Boolean(updatedChannel.box || updatedChannel.u);
        const isRocketDone = Boolean(updatedChannel.rocket || updatedChannel.o);
        const isPieDone = Boolean(updatedChannel.pie || updatedChannel.p);

        updatedChannel.active = isBoxDone && isRocketDone && isPieDone;
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
    localTaskUpdatesRef.current[taskId] = Date.now();
    setTasks(prev => prev.map(t => {
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
    localTaskUpdatesRef.current[taskId] = Date.now();
    setTasks(prev => prev.map(t => {
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

  const handleUpdateTaskChecklist = (taskId, newChecklist) => {
    localTaskUpdatesRef.current[taskId] = Date.now();
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedTask = {
          ...t,
          checklist: newChecklist
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

  const handleSaveChecklistTemplate = (newTemplate) => {
    setChecklistTemplates(prev => {
      const filtered = prev.filter(tmpl => tmpl.name.toLowerCase() !== newTemplate.name.toLowerCase());
      return [...filtered, newTemplate];
    });
    SheetsApi.saveChecklistTemplate(newTemplate);
  };

  const handleDeleteChecklistTemplate = (templateId) => {
    setChecklistTemplates(prev => prev.filter(t => t.id !== templateId));
    SheetsApi.deleteChecklistTemplate(templateId);
  };

  const handleReassignTask = (taskId, newAssigneeId) => {
    localTaskUpdatesRef.current[taskId] = Date.now();
    setTasks(prev => prev.map(t => {
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
    const strId = String(id);
    const now = Date.now();
    localTaskUpdatesRef.current[id] = now;
    localTaskUpdatesRef.current[strId] = now;
    setTasks(prev => prev.map(t => {
      if (String(t.id) === strId || t.id === id) {
        const updated = { ...t, ...updatedFields };
        SheetsApi.syncTask(updated);
        return updated;
      }
      return t;
    }));
  };

  const handleDeleteTask = (taskOrId) => {
    const id = typeof taskOrId === 'object' ? taskOrId.id : taskOrId;
    delete localTaskUpdatesRef.current[id];
    setTasks(prev => prev.filter(t => {
      if (t.id === id) return false;
      if (typeof taskOrId === 'object' && taskOrId.sku && t.sku === taskOrId.sku && t.assignedTo === taskOrId.assignedTo) {
        return false;
      }
      return true;
    }));
    SheetsApi.deleteTask(taskOrId);
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

    setTasks(prev => prev.filter(t => t.id !== taskToFinish.id));
    setCompletedTasks(prev => [finishedTask, ...prev]);
    setCelebratingTask(finishedTask);

    SheetsApi.finishTask(finishedTask);

    // Se for Tarefa Recorrente, agenda automaticamente o próximo ciclo na lista de tarefas ativas
    if (taskToFinish.type === 'recurrent') {
      const freq = taskToFinish.recurrence?.frequency || 'semanal';
      const nextDate = new Date();

      if (freq === 'diaria') {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (freq === 'seg_sex') {
        nextDate.setDate(nextDate.getDate() + 1);
        // Se cair no sábado (6), pula para segunda (+2)
        if (nextDate.getDay() === 6) nextDate.setDate(nextDate.getDate() + 2);
        // Se cair no domingo (0), pula para segunda (+1)
        else if (nextDate.getDay() === 0) nextDate.setDate(nextDate.getDate() + 1);
      } else if (freq === 'quinzenal') {
        nextDate.setDate(nextDate.getDate() + 15);
      } else if (freq === 'mensal') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else {
        // semanal: adiciona 7 dias por padrão
        nextDate.setDate(nextDate.getDate() + 7);
      }

      const formattedNextDue = `${String(nextDate.getDate()).padStart(2, '0')}/${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
      const nextTaskId = 'task_' + Date.now();

      // Clona subtarefas com status não concluído
      const resetChecklist = Array.isArray(taskToFinish.checklist)
        ? taskToFinish.checklist.map((item, idx) => ({
            ...item,
            id: `rec_${Date.now()}_${idx}`,
            completed: false
          }))
        : [];

      // Clona marketplaces com status pendente
      const resetMarketplaces = {};
      if (taskToFinish.marketplaces && typeof taskToFinish.marketplaces === 'object') {
        Object.keys(taskToFinish.marketplaces).forEach(k => {
          const orig = taskToFinish.marketplaces[k];
          resetMarketplaces[k] = {
            ...orig,
            u: false,
            o: false,
            active: false,
            status: 'pending'
          };
        });
      }

      const nextRecurrentTask = {
        ...taskToFinish,
        id: nextTaskId,
        status: 'in_progress',
        dueDate: formattedNextDue,
        completedAt: null,
        finishedTimestamp: null,
        checklist: resetChecklist,
        marketplaces: resetMarketplaces,
        createdAt: new Date().toISOString()
      };

      localTaskUpdatesRef.current[nextTaskId] = Date.now();
      setTimeout(() => {
        setTasks(prev => [nextRecurrentTask, ...prev]);
        SheetsApi.syncTask(nextRecurrentTask);
      }, 500);
    }
  };

  const handleUnfinishTask = (taskToReactivate) => {
    const reactivated = {
      ...taskToReactivate,
      status: 'in_progress',
      completedAt: null
    };

    setCompletedTasks(prev => prev.filter(t => t.id !== taskToReactivate.id));
    setTasks(prev => [reactivated, ...prev]);

    SheetsApi.unfinishTask(reactivated);
  };

  const handleDeleteCompletedTask = (taskOrId) => {
    const id = typeof taskOrId === 'object' ? taskOrId.id : taskOrId;
    setCompletedTasks(prev => prev.filter(t => {
      if (t.id === id) return false;
      if (typeof taskOrId === 'object' && taskOrId.sku && t.sku === taskOrId.sku && t.assignedTo === taskOrId.assignedTo) {
        return false;
      }
      return true;
    }));
    SheetsApi.deleteCompletedTask(taskOrId);
  };

  const handleUpdateCompletedTask = (id, updatedFields) => {
    setCompletedTasks(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updatedFields };
        SheetsApi.syncCompletedTask(updated);
        return updated;
      }
      return t;
    }));
  };

  // Handler de Anotações (Foto 1 e 2 - Salva na aba Anotação da Planilha)
  const handleSaveAnnotation = async (annotationData) => {
    return await SheetsApi.saveAnnotation(annotationData);
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
          isMobileMode={isMobileMode}
          onToggleViewMode={(mode) => {
            const isMob = mode === 'mobile';
            setIsMobileMode(isMob);
            localStorage.setItem('taresk_view_mode', mode);
            if (isMob) {
              window.location.hash = 'mobile';
            } else {
              if (window.location.hash.toLowerCase().includes('mobile')) {
                window.location.hash = '';
              }
            }
          }}
        />
      </>
    );
  }

  if (isMobileMode) {
    const isDark = appTheme === 'dark';
    return (
      <div style={{ minHeight: '100vh', background: isDark ? '#0b0f19' : '#f1f5f9' }} className={isDark ? 'dark-mode' : ''}>
        <MobileAppView
          tasks={tasks}
          completedTasks={completedTasks}
          users={users}
          platforms={platforms}
          currentUser={currentUser}
          products={products}
          appTheme={appTheme}
          onOpenChecklistModal={(task) => setActiveChecklistTask(task)}
          onToggleMarketplace={handleToggleMarketplace}
          onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
          onFinishTask={handleFinishTask}
          onToggleChecklistItem={handleToggleChecklistItem}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onDuplicateTask={handleDuplicateTask}
          onLogout={handleLogout}
          onChangeCurrentUser={handleLogin}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onSync={refreshFromSheets}
          isSyncing={isSyncing}
          onSwitchToDesktop={() => {
            setIsMobileMode(false);
            localStorage.setItem('taresk_view_mode', 'desktop');
            if (window.location.hash.toLowerCase().includes('mobile')) {
              window.location.hash = '';
            }
          }}
          onOpenAnnotationModal={() => setIsAnnotationModalOpen(true)}
        />

        {/* Modais compartilhados para uso no mobile */}
        <AnnotationModal
          isOpen={isAnnotationModalOpen}
          onClose={() => setIsAnnotationModalOpen(false)}
          currentUser={currentUser}
          onSave={handleSaveAnnotation}
        />

        <NewTaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          products={products}
          users={users}
          platforms={platforms}
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
          onUpdateTaskChecklist={handleUpdateTaskChecklist}
          templates={checklistTemplates}
          onSaveTemplate={handleSaveChecklistTemplate}
          onDeleteTemplate={handleDeleteChecklistTemplate}
        />

        <DopamineCelebrationModal
          isOpen={!!celebratingTask}
          onClose={() => setCelebratingTask(null)}
          taskTitle={celebratingTask?.title}
          assigneeName={users.find(u => u.id === celebratingTask?.assignedTo)?.name}
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
          isMobileMode={isMobileMode}
          onToggleViewMode={(mode) => {
            const isMob = mode === 'mobile';
            setIsMobileMode(isMob);
            localStorage.setItem('taresk_view_mode', mode);
            if (isMob) {
              window.location.hash = 'mobile';
            } else {
              if (window.location.hash.toLowerCase().includes('mobile')) {
                window.location.hash = '';
              }
            }
          }}
        />
      </div>
    );
  }

  const isDark = appTheme === 'dark';
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: isDark ? '#0b0f19' : '#f8fafc' }} className={isDark ? 'dark-mode' : ''}>
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
            platforms={platforms}
            currentUser={currentUser}
            onOpenChecklistModal={(task) => setActiveChecklistTask(task)}
            onToggleMarketplace={handleToggleMarketplace}
            onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
            onFinishTask={handleFinishTask}
            onToggleChecklistItem={handleToggleChecklistItem}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onDuplicateTask={handleDuplicateTask}
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
        platforms={platforms}
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
        onUpdateTaskChecklist={handleUpdateTaskChecklist}
        templates={checklistTemplates}
        onSaveTemplate={handleSaveChecklistTemplate}
        onDeleteTemplate={handleDeleteChecklistTemplate}
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
        isMobileMode={isMobileMode}
        onToggleViewMode={(mode) => {
          const isMob = mode === 'mobile';
          setIsMobileMode(isMob);
          localStorage.setItem('taresk_view_mode', mode);
          if (isMob) {
            window.location.hash = 'mobile';
          } else {
            if (window.location.hash.toLowerCase().includes('mobile')) {
              window.location.hash = '';
            }
          }
        }}
      />

      {/* Modal de Anotação (Desktop) */}
      <AnnotationModal
        isOpen={isAnnotationModalOpen}
        onClose={() => setIsAnnotationModalOpen(false)}
        currentUser={currentUser}
        onSave={handleSaveAnnotation}
      />

      {/* Botão Flutuante de Anotação no Desktop */}
      <button
        type="button"
        onClick={() => setIsAnnotationModalOpen(true)}
        title="Fazer Anotação"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 9999,
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          background: '#6d28d9',
          color: '#ffffff',
          border: '3px solid #ffffff',
          boxShadow: '0 8px 24px rgba(109, 40, 217, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.background = '#5b21b6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = '#6d28d9';
        }}
      >
        <svg width="42" height="42" viewBox="0 0 48 48" fill="none">
          <rect x="9" y="7" width="26" height="34" rx="4" fill="#ffffff" />
          <line x1="15" y1="14" x2="27" y2="14" stroke="#6d28d9" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="15" y1="20" x2="29" y2="20" stroke="#6d28d9" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="15" y1="26" x2="26" y2="26" stroke="#6d28d9" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="15" y1="32" x2="22" y2="32" stroke="#6d28d9" strokeWidth="2.4" strokeLinecap="round" />
          <g transform="translate(19, 14)">
            <rect x="8" y="1" width="5.5" height="18" rx="2" transform="rotate(45 8 1)" fill="#6d28d9" />
            <polygon points="4,22 1,25 4,20" fill="#6d28d9" />
          </g>
          <path d="M36 6 L37.5 9 L40.5 10.5 L37.5 12 L36 15 L34.5 12 L31.5 10.5 L34.5 9 Z" fill="#ffffff" />
          <path d="M39 21 L39.8 22.5 L41.5 23.3 L39.8 24.1 L39 25.6 L38.2 24.1 L36.5 23.3 L38.2 22.5 Z" fill="#ffffff" />
        </svg>
      </button>
    </div>
  );
}
