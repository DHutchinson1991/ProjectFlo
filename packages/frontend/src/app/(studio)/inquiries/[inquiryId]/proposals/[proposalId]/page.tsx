'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Box, Typography, Paper, CircularProgress, Button, TextField, Select, MenuItem, InputLabel, FormControl,
    Snackbar, Alert, IconButton, Divider, Stack, Card, CardContent, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SaveIcon from '@mui/icons-material/Save';
import ScheduleIcon from '@mui/icons-material/Schedule';

// Services & Types
import { proposalsService, api } from '@/lib/api'; // FIXED IMPORT
import {
    Proposal, ProposalSection, ProposalContent,
    HeroSection, TextSection, PricingSection, MediaSection, ScheduleSection,
    ServicePackage, ServicePackageItem
} from '@/lib/types/domains/sales';
import { useBrand } from '@/app/providers/BrandProvider';
import { formatCurrency } from '@/lib/utils/formatUtils';

// Blocks
import EditorBlock from '@/components/proposals/EditorBlock';
import ProposalSchedulePreview from '@/components/schedule/ProposalSchedulePreview';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function ProposalBuilderPage() {
    const params = useParams();
    // Safely handle params which could be string or string[]
    const inquiryId = Array.isArray(params.inquiryId) ? params.inquiryId[0] : params.inquiryId;
    const proposalId = Array.isArray(params.proposalId) ? params.proposalId[0] : params.proposalId;
    const { currentBrand } = useBrand();
    const currencyCode = currentBrand?.currency || 'USD';

    const [isLoading, setIsLoading] = useState(true);
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [sections, setSections] = useState<ProposalSection[]>([]);
    const [availablePackages, setAvailablePackages] = useState<ServicePackage[]>([]);
    const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);

    // --- 1. Load Data ---
    useEffect(() => {
        const loadData = async () => {
            if (!inquiryId || !proposalId) return;
            try {
                const data = await proposalsService.getOne(inquiryId, proposalId);
                setProposal(data as Proposal);

                // Fetch Available Packages
                const brandId = data.inquiry?.brand_id || data.inquiry?.contact?.brand_id;
                let pkgs: ServicePackage[] = [];
                
                if (brandId) {
                    try {
                        pkgs = await api.servicePackages.getAll(brandId);
                        setAvailablePackages(pkgs);
                    } catch (e) {
                         console.error("Failed to load packages", e);
                    }
                }
                
                let existingSections: ProposalSection[] = [];
                // Handle new format vs legacy
                if (data.content && typeof data.content === 'object') {
                    const contentObj = data.content as any;
                    if (Array.isArray(contentObj.sections)) {
                        existingSections = contentObj.sections;
                    } else if (contentObj.blocks) {
                         // Convert legacy EditorJS to Text Section
                         existingSections = [{
                            id: generateId(),
                            type: 'text',
                            isVisible: true,
                            data: { blocks: contentObj.blocks }
                         } as TextSection];
                    }
                }

                // Default Hero if empty
                if (existingSections.length === 0) {
                    existingSections.push({
                        id: generateId(),
                        type: 'hero',
                        isVisible: true,
                        data: {
                            title: data.title || 'New Proposal',
                            subtitle: 'Prepared for you',
                            backgroundImageUrl: ''
                        }
                    } as HeroSection);

                    // Auto-populate Pricing Section from Inquiry Selection
                    const selectedPkgId = data.inquiry?.selected_package_id;
                    if (selectedPkgId) {
                        const selectedPkg = pkgs.find(p => p.id === selectedPkgId);
                        
                        existingSections.push({
                            id: generateId(),
                            type: 'pricing',
                            isVisible: true,
                            data: {
                                packageId: selectedPkgId,
                                items: selectedPkg?.contents?.items || [],
                                showLineItems: true,
                                showTotal: true,
                                allowAddons: false
                            }
                        } as PricingSection);
                    }
                }

                setSections(existingSections);
            } catch (error) {
                console.error('Failed to load proposal', error);
                setNotification({ message: 'Failed to load proposal.', severity: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [inquiryId, proposalId]);

    // --- 2. Action Handlers ---
    
    const handleSave = async () => {
        if (!proposal || !inquiryId) return;
        try {
            const contentToSave: ProposalContent = {
                theme: 'cinematic-dark', // Default theme
                meta: {},
                sections: sections
            };

            await proposalsService.update(inquiryId, proposal.id, {
                title: proposal.title,
                status: proposal.status,
                content: contentToSave
            });
            setNotification({ message: 'Proposal saved successfully!', severity: 'success' });
        } catch (err) {
            console.error(err);
            setNotification({ message: 'Error saving proposal', severity: 'error' });
        }
    };

    const addSection = (type: ProposalSection['type']) => {
        let newSection: ProposalSection;
        const id = generateId();
        const base = { id, isVisible: true };

        switch (type) {
            case 'hero':
                newSection = { ...base, type: 'hero', data: { title: 'New Section', subtitle: '', backgroundImageUrl: '' } };
                break;
            case 'text':
                newSection = { ...base, type: 'text', data: { blocks: [] } };
                break;
            case 'pricing':
                newSection = { ...base, type: 'pricing', data: { showLineItems: true, showTotal: true, allowAddons: false } };
                break;
            case 'media':
                newSection = { ...base, type: 'media', data: { items: [], layout: 'featured' } };
                break;
            case 'schedule':
                newSection = {
                    ...base,
                    type: 'schedule',
                    data: {
                        ownerType: 'inquiry',
                        ownerId: Number(inquiryId) || 0,
                        title: 'Your Day Timeline',
                        showDetails: true,
                    },
                };
                break;
            default:
                return;
        }
        setSections([...sections, newSection]);
    };

    const removeSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === sections.length - 1) return;
        
        const newSections = [...sections];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
        setSections(newSections);
    };

    // Generic updater: updates nested 'data' property
    const updateSectionData = (id: string, newData: any) => {
        setSections(sections.map(s => {
            if (s.id === id) {
                // We need to fetch the existing data to merge properly
                // Since this is generic, we assume 'data' property exists on all our sections
                const updated = { ...s, data: { ...(s as any).data, ...newData } };
                return updated as ProposalSection;
            }
            return s;
        }));
    };

    // --- 3. Render Helpers (The Blocks) ---

    const renderHeroBlock = (section: HeroSection) => (
        <Box sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">Hero Section</Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField 
                    label="Title" fullWidth size="small" 
                    value={section.data.title} 
                    onChange={e => updateSectionData(section.id, { title: e.target.value })} 
                />
                <TextField 
                    label="Subtitle" fullWidth size="small" 
                    value={section.data.subtitle} 
                    onChange={e => updateSectionData(section.id, { subtitle: e.target.value })} 
                />
                <TextField 
                    label="Background Image URL" fullWidth size="small" 
                    value={section.data.backgroundImageUrl} 
                    onChange={e => updateSectionData(section.id, { backgroundImageUrl: e.target.value })} 
                />
            </Stack>
        </Box>
    );

    const renderTextBlock = (section: TextSection) => (
         <Box sx={{ p: 2 }}>
            <Typography variant="overline" sx={{ color: '#aaa' }}>Text Content</Typography>
            <Box sx={{ mt: 1, border: '1px solid #444', borderRadius: 1, p: 1, minHeight: 100, bgcolor: '#fff', color: '#000' }}>
                <EditorBlock 
                    data={{ blocks: section.data.blocks }} // Adapt to EditorJS format
                    holder={`editor-${section.id}`}
                    onChange={(newContent) => updateSectionData(section.id, { blocks: newContent.blocks })}
                    readOnly={false}
                />
            </Box>
        </Box>
    );

    const renderPricingBlock = (section: PricingSection) => (
        <Box sx={{ p: 2 }}>
            <Typography variant="overline" sx={{ color: '#aaa' }}>Pricing Table</Typography>

            {/* Package Selector */}
            <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
                <InputLabel>Load Package Template</InputLabel>
                <Select
                    label="Load Package Template"
                    value={section.data.packageId || ''}
                    onChange={(e) => {
                        const pkgId = Number(e.target.value);
                        const pkg = availablePackages.find(p => p.id === pkgId);
                        if (pkg) {
                            // Load items from package
                            updateSectionData(section.id, { 
                                packageId: pkgId,
                                items: pkg.contents.items || [] 
                            });
                        } else if (e.target.value === '') {
                             updateSectionData(section.id, { packageId: undefined });
                        }
                    }}
                >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {availablePackages.map(pkg => (
                        <MenuItem key={pkg.id} value={pkg.id}>
                            {pkg.name} ({formatCurrency(Number(pkg.base_price ?? 0), currencyCode || pkg.currency || 'USD')})
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Box sx={{ bgcolor: '#1e2830', p: 2, borderRadius: 1 }}>
                
                {/* Line Items List */}
                <Stack spacing={1}>
                    {(section.data.items || []).map((item: ServicePackageItem, idx: number) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#2c3e50', borderRadius: 1 }}>
                            <Box>
                                <Typography variant="body2" sx={{ color: '#fff' }}>{item.description || 'Unnamed Item'}</Typography>
                                <Typography variant="caption" sx={{ color: '#aaa' }}>{item.type}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" sx={{ color: '#4d9bf0' }}>
                                    {formatCurrency(Number(item.price ?? 0), currencyCode)}
                                </Typography>
                                <IconButton size="small" onClick={() => {
                                    const newItems = [...(section.data.items || [])];
                                    newItems.splice(idx, 1);
                                    updateSectionData(section.id, { items: newItems });
                                }}>
                                    <DeleteIcon fontSize="small" sx={{ color: '#aaa' }} />
                                </IconButton>
                            </Box>
                        </Box>
                    ))}
                    {(section.data.items || []).length === 0 && (
                        <Alert severity="info" sx={{ bgcolor: 'transparent', color: '#aaa' }}>
                            No line items. Select a package or add manually.
                        </Alert>
                    )}
                </Stack>
                
                {/* Total */}
                {(section.data.items || []).length > 0 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #444', display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" sx={{ color: '#ccc' }}>Total</Typography>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#fff' }}>
                            {formatCurrency(
                                (section.data.items || []).reduce((sum: number, i: ServicePackageItem) => sum + (Number(i.price) || 0), 0),
                                currencyCode
                            )}
                        </Typography>
                    </Box>
                )}
            </Box>

            <Button variant="outlined" size="small" startIcon={<AddIcon />} sx={{ mt: 2, color: '#aaa', borderColor: '#444' }} onClick={() => {
                const newItems = [...(section.data.items || [])];
                newItems.push({ description: 'New Line Item', price: 0, type: 'service' } as ServicePackageItem);
                updateSectionData(section.id, { items: newItems });
            }}>
                Add Custom Item
            </Button>
        </Box>
    );

     const renderMediaBlock = (section: MediaSection) => {
        // Simple manual single item entry for now
        const firstItem = section.data.items?.[0] || { url: '', caption: '', type: 'image' };

        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="overline" sx={{ color: '#aaa' }}>Media (Image/Video)</Typography>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField 
                        label="Media URL" fullWidth size="small" 
                        value={firstItem.url} 
                        onChange={e => {
                            const newItems = [...(section.data.items || [])];
                            if (newItems.length === 0) newItems.push({ id: generateId(), type: 'image', url: '' });
                            newItems[0].url = e.target.value;
                            updateSectionData(section.id, { items: newItems });
                        }}
                    />
                     <FormControl fullWidth size="small">
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={firstItem.type}
                            label="Type"
                            onChange={(e) => {
                                const newItems = [...(section.data.items || [])];
                                if (newItems.length === 0) newItems.push({ id: generateId(), type: 'image', url: '' });
                                newItems[0].type = e.target.value as 'image' | 'video';
                                updateSectionData(section.id, { items: newItems });
                            }}
                        >
                            <MenuItem value="image">Image</MenuItem>
                            <MenuItem value="video">Video</MenuItem>
                        </Select>
                     </FormControl>
                </Stack>
            </Box>
        );
    };

    const renderScheduleBlock = (section: ScheduleSection) => (
        <Box sx={{ p: 2 }}>
            <Typography variant="overline" sx={{ color: '#aaa' }}>Schedule Timeline</Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                    label="Section Title"
                    fullWidth
                    size="small"
                    value={section.data.title || ''}
                    onChange={e => updateSectionData(section.id, { title: e.target.value })}
                />
                <ProposalSchedulePreview
                    ownerType={section.data.ownerType}
                    ownerId={section.data.ownerId}
                    showDetails={section.data.showDetails ?? true}
                />
            </Stack>
        </Box>
    );


    if (isLoading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', bgcolor: '#121212', color: '#fff' }}>
            
            {/* MAIN PREVIEW / BUILDER AREA */}
            <Box sx={{ flexGrow: 1, p: 4, overflowY: 'auto' }}>
                <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                    
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff' }}>Proposal Builder</Typography>
                        <Box>
                            <Button 
                                variant="contained" 
                                startIcon={<SaveIcon />} 
                                onClick={handleSave}
                                size="large"
                                sx={{ bgcolor: '#3f51b5', '&:hover': { bgcolor: '#303f9f' } }}
                            >
                                Save Changes
                            </Button>
                        </Box>
                    </Box>

                    {/* SECTIONS LIST */}
                    <Stack spacing={3}>
                        {sections.map((section, index) => (
                            <Card key={section.id} elevation={3} sx={{ 
                                position: 'relative', 
                                overflow: 'visible',
                                bgcolor: '#1e1e1e', // Dark card background
                                color: '#eee',
                                border: '1px solid #333'
                            }}>
                                {/* Floating Action Bar for Block */}
                                <Box sx={{ 
                                    position: 'absolute', 
                                    right: -50, 
                                    top: 0, 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    gap: 1
                                }}>
                                    <IconButton size="small" onClick={() => moveSection(index, 'up')} disabled={index === 0} sx={{ color: '#888', '&:hover': { color: '#fff' } }}>
                                        <ArrowUpwardIcon />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} sx={{ color: '#888', '&:hover': { color: '#fff' } }}>
                                        <ArrowDownwardIcon />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => removeSection(section.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>

                                {/* Block Content */}
                                <CardContent sx={{ p: 0 }}>
                                    {/* Pass dark mode flag if needed or handle internal styling */}
                                    <Box sx={{ '& .MuiTypography-root': { color: '#ccc' }, '& .MuiInputBase-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#888' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}>
                                        {section.type === 'hero' && renderHeroBlock(section as HeroSection)}
                                        {section.type === 'text' && renderTextBlock(section as TextSection)}
                                        {section.type === 'pricing' && renderPricingBlock(section as PricingSection)}
                                        {section.type === 'media' && renderMediaBlock(section as MediaSection)}
                                        {section.type === 'schedule' && renderScheduleBlock(section as ScheduleSection)}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>

                    {/* ADD NEW BLOCK AREA */}
                    <Divider sx={{ my: 4, '&::before, &::after': { borderColor: '#333' } }}>
                        <Chip label="Add New Section" sx={{ bgcolor: '#333', color: '#ccc' }} />
                    </Divider>
                    
                    <Paper sx={{ p: 3, display: 'flex', gap: 2, justifyContent: 'center', bgcolor: '#1e1e1e', border: '1px dashed #444' }}>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addSection('hero')} sx={{ color: '#ccc', borderColor: '#444', '&:hover': { borderColor: '#666', bgcolor: '#252525' } }}>
                            Hero
                        </Button>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addSection('text')} sx={{ color: '#ccc', borderColor: '#444', '&:hover': { borderColor: '#666', bgcolor: '#252525' } }}>
                            Text
                        </Button>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addSection('pricing')} sx={{ color: '#ccc', borderColor: '#444', '&:hover': { borderColor: '#666', bgcolor: '#252525' } }}>
                            Pricing
                        </Button>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addSection('media')} sx={{ color: '#ccc', borderColor: '#444', '&:hover': { borderColor: '#666', bgcolor: '#252525' } }}>
                            Media
                        </Button>
                        <Button variant="outlined" startIcon={<ScheduleIcon />} onClick={() => addSection('schedule')} sx={{ color: '#ccc', borderColor: '#444', '&:hover': { borderColor: '#666', bgcolor: '#252525' } }}>
                            Schedule
                        </Button>
                    </Paper>

                    <Box sx={{ height: 100 }} /> {/* Bottom Spacer */}
                </Box>
            </Box>

             {/* SIDEBAR SETTINGS */}
             <Paper sx={{ width: 300, borderLeft: '1px solid #333', p: 2, display: { xs: 'none', lg: 'block' }, bgcolor: '#181818', color: '#eee' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Proposal Settings</Typography>
                <Stack spacing={2} sx={{ '& .MuiInputBase-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#888' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' }, '& .MuiSvgIcon-root': { color: '#888' } }}>
                    <TextField 
                        label="Internal Title" 
                        fullWidth 
                        size="small"
                        value={proposal?.title || ''}
                        onChange={e => setProposal(prev => ({...prev!, title: e.target.value}))}
                    />
                     <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={proposal?.status || 'Draft'}
                            label="Status"
                            onChange={(e) => setProposal((prev) => ({ ...prev!, status: e.target.value as any }))}
                        >
                            <MenuItem value="Draft">Draft</MenuItem>
                            <MenuItem value="Sent">Sent</MenuItem>
                            <MenuItem value="Accepted">Accepted</MenuItem>
                            <MenuItem value="Declined">Declined</MenuItem>
                        </Select>
                    </FormControl>
                    <Divider sx={{ borderColor: '#333' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ color: '#888' }}>
                        Drag and drop sections or use the arrows to reorder content. 
                        Each "Text" block supports rich editing.
                    </Typography>
                </Stack>
             </Paper>

            <Snackbar open={!!notification} autoHideDuration={6000} onClose={() => setNotification(null)}>
                <Alert onClose={() => setNotification(null)} severity={notification?.severity || 'info'} sx={{ width: '100%' }}>
                    {notification?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
