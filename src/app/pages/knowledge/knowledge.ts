import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface KnowledgeAsset {
  id: string;
  title: string;
  category: string;
  type: 'PDF' | 'PPT' | 'Video' | 'Article';
  visibility: 'Public' | 'Registered-Only' | 'Event-Only';
  downloadCount: number;
  fileName: string;
  description: string;
}

@Component({
  selector: 'app-knowledge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knowledge.html',
  styleUrl: './knowledge.css'
})
export class KnowledgeBaseComponent implements OnInit {
  searchQuery = '';
  selectedCategory = 'All';
  selectedType = 'All';

  categories = ['All', 'Cardiology', 'Pediatrics', 'Surgery', 'Radiology', 'General Medicine'];
  types = ['All', 'PDF', 'PPT', 'Video', 'Article'];

  assets: KnowledgeAsset[] = [
    {
      id: 'kb-001',
      title: 'Advanced Cardiac Life Support (ACLS) Emergency Protocol 2026',
      category: 'Cardiology',
      type: 'PDF',
      visibility: 'Public',
      downloadCount: 342,
      fileName: 'ACLS_Emergency_Protocol_2026.pdf',
      description: 'Official clinical step-by-step algorithms for VF/pVT, Asystole, PEA, and post-cardiac arrest targeted temperature management.'
    },
    {
      id: 'kb-002',
      title: 'Pediatric Resuscitation & Septic Shock Guidelines (NRP/PALS)',
      category: 'Pediatrics',
      type: 'PDF',
      visibility: 'Registered-Only',
      downloadCount: 219,
      fileName: 'PALS_NRP_Guideline_Summary.pdf',
      description: 'Comprehensive guidelines for pediatric airway calculations, cuffed/uncuffed tube sizes, and Hour-1 fluid/vasopressor administration.'
    },
    {
      id: 'kb-003',
      title: 'Ventilator Settings & ARDS Lung Protection Protocol Slides',
      category: 'General Medicine',
      type: 'PPT',
      visibility: 'Registered-Only',
      downloadCount: 184,
      fileName: 'ARDS_Ventilation_Mastery_Slides.pptx',
      description: 'Slide presentation on lung protective low tidal volume settings, plateau pressure limits, and spontaneous breathing trials (SBT).'
    },
    {
      id: 'kb-004',
      title: 'Vasoactive Drugs Infusions & CYP450 Dangerous Interactions Chart',
      category: 'General Medicine',
      type: 'PPT',
      visibility: 'Public',
      downloadCount: 502,
      fileName: 'Vasoactive_Drugs_Interactions_Chart.pptx',
      description: 'Clinical wall-chart detailing Dobutamine, Dopamine, and Norepinephrine mcg/kg/min dosing along with CYP3A4 inhibitors/inducers list.'
    },
    {
      id: 'kb-005',
      title: 'Advanced Laparoscopic Minimal Access GI Surgery Operative Video',
      category: 'Surgery',
      type: 'Video',
      visibility: 'Event-Only',
      downloadCount: 67,
      fileName: 'Laparoscopic_GI_Surgery_Demo.mp4',
      description: 'High-definition surgical video demonstrating sentinel node biopsy and laparoscopic fundoplication techniques.'
    },
    {
      id: 'kb-006',
      title: 'Modern Radiology & Deep Learning AI CT/MRI Diagnostics Paper',
      category: 'Radiology',
      type: 'Article',
      visibility: 'Event-Only',
      downloadCount: 115,
      fileName: 'AI_DeepLearning_Radiology_CT_MRI.pdf',
      description: 'Peer-reviewed clinical publication review on automated neural networks detecting cerebral infarcts and lung nodules.'
    }
  ];

  private isBrowser: boolean;

  constructor(
    public authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Load dynamic download counts from storage if available
    if (this.isBrowser) {
      const savedCounts = localStorage.getItem('medcme_kb_downloads');
      if (savedCounts) {
        try {
          const parsed = JSON.parse(savedCounts);
          this.assets.forEach(asset => {
            if (parsed[asset.id] !== undefined) {
              asset.downloadCount = parsed[asset.id];
            }
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  get filteredAssets(): KnowledgeAsset[] {
    return this.assets.filter(asset => {
      // Keyword search
      const matchesSearch = !this.searchQuery.trim() || 
        asset.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        asset.category.toLowerCase().includes(this.searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = this.selectedCategory === 'All' || asset.category === this.selectedCategory;

      // Type filter
      const matchesType = this.selectedType === 'All' || asset.type === this.selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }

  downloadAsset(asset: KnowledgeAsset) {
    // Increment download count
    asset.downloadCount++;
    
    if (this.isBrowser) {
      const counts: Record<string, number> = {};
      this.assets.forEach(a => {
        counts[a.id] = a.downloadCount;
      });
      localStorage.setItem('medcme_kb_downloads', JSON.stringify(counts));
      
      const globalStore = (window as any).medcme_uploaded_files;
      const uploadedFileBase64 = globalStore ? globalStore[asset.fileName] : null;

      if (uploadedFileBase64) {
        const fetchAndDownload = async () => {
          try {
            const res = await fetch(uploadedFileBase64);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = asset.fileName;
            a.click();
            window.URL.revokeObjectURL(url);
            alert(`Resource "${asset.title}" downloaded successfully!`);
          } catch (err) {
            console.error('Error downloading uploaded asset', err);
          }
        };
        fetchAndDownload();
      } else {
        const finalFileName = asset.fileName.toLowerCase().endsWith('.txt') ? asset.fileName : asset.fileName + '.txt';
        const blob = new Blob([
          `MedCME Knowledge Base Resource File\n` +
          `Title: ${asset.title}\n` +
          `Filename: ${asset.fileName}\n` +
          `Category: ${asset.category}\n` +
          `Access Restriction: ${asset.visibility}\n\n` +
          `This file contains official continuing medical education resources.`
        ], { type: 'text/plain' });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFileName;
        a.click();
        window.URL.revokeObjectURL(url);
        
        alert(`Resource "${asset.title}" downloaded as text file "${finalFileName}" successfully!`);
      }
    }
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToMyLearning() {
    this.router.navigate(['/my-learning']);
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  resetAllFilters() {
    this.searchQuery = '';
    this.selectedCategory = 'All';
    this.selectedType = 'All';
  }
}
