import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);

  private hasView = false;

  @Input() set appHasPermission(permission: string | string[]) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasPermission = this.checkPermission(permissions);

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private checkPermission(permissions: string[]): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;

    // Check if user has any of the required permissions
    const userPermissions = user.roles?.flatMap((r: any) => r.permissions?.map((p: any) => p.name) || []) || [];
    return permissions.some(p => userPermissions.includes(p));
  }
}
