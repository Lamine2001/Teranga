import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  active?: boolean;
  icon?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Input() showIcons = true;
  @Input() separator = '›';

  constructor() { }

  isLastItem(item: BreadcrumbItem): boolean {
    const index = this.items.indexOf(item);
    return index === this.items.length - 1;
  }

  getItemClass(item: BreadcrumbItem): string {
    let classes = 'breadcrumb-item';
    if (item.active) {
      classes += ' active';
    }
    return classes;
  }
}
