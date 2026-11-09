import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface AuthorizationView {
  activityTitle: string;
  eventAt: string;
  responseDeadline: string;
  studentDisplayName: string;
  consentText: string;
  consentVersion: string;
}

@Component({
  selector: 'app-authorization-response',
  standalone: true,
  template: `
    <main class="page">
      @if (loading()) {
        <p role="status">Cargando la solicitud...</p>
      } @else if (error()) {
        <section class="panel" role="alert">
          <h1>No podemos abrir esta autorización</h1>
          <p>El enlace puede haber vencido o ya fue utilizado. Comuníquese con la escuela.</p>
        </section>
      } @else if (completed()) {
        <section class="panel" role="status">
          <h1>Respuesta registrada</h1>
          <p>La escuela recibió su decisión. Puede cerrar esta página.</p>
        </section>
      } @else if (view()) {
        <section class="panel">
          <p class="eyebrow">Solicitud de la institución</p>
          <h1>{{ view()!.activityTitle }}</h1>
          <p><strong>Estudiante:</strong> {{ view()!.studentDisplayName }}</p>
          <p><strong>Fecha:</strong> {{ view()!.eventAt | date:'medium' }}</p>
          <p><strong>Responder antes de:</strong> {{ view()!.responseDeadline | date:'medium' }}</p>
          <div class="consent">{{ view()!.consentText }}</div>
          <fieldset>
            <legend>Seleccione su decisión</legend>
            <label><input type="radio" name="decision" value="AUTHORIZED"
              [checked]="decision() === 'AUTHORIZED'"
              (change)="decision.set('AUTHORIZED')"> Autorizo</label>
            <label><input type="radio" name="decision" value="NOT_AUTHORIZED"
              [checked]="decision() === 'NOT_AUTHORIZED'"
              (change)="decision.set('NOT_AUTHORIZED')"> No autorizo</label>
          </fieldset>
          <label class="confirm">
            <input type="checkbox" [checked]="confirmed()"
              (change)="confirmed.set($any($event.target).checked)">
            Confirmo que esta es mi decisión.
          </label>
          <button type="button" [disabled]="!decision() || !confirmed() || submitting()"
            (click)="submit()">
            {{ submitting() ? 'Enviando...' : 'Confirmar respuesta' }}
          </button>
          <p class="help">Si tiene dudas, contacte directamente a la institución.</p>
        </section>
      }
    </main>
  `,
  styles: [`
    :host { display:block; min-height:100vh; background:#F5F7FA; color:#172B4D;
      font-family:Inter,system-ui,sans-serif; }
    .page { max-width:680px; margin:auto; padding:24px 16px; }
    .panel { background:white; border:1px solid #D8E0EA; border-radius:16px;
      padding:24px; box-shadow:0 4px 18px rgba(23,59,103,.06); }
    h1 { color:#173B67; font-size:1.5rem; line-height:1.25; }
    .eyebrow,.help { color:#52647A; }
    .consent { margin:20px 0; padding:16px; background:#F5F7FA; border-radius:8px; }
    fieldset { border:0; padding:0; display:grid; gap:12px; }
    legend { font-weight:700; margin-bottom:10px; }
    label { display:flex; gap:10px; align-items:center; min-height:44px; }
    button { width:100%; min-height:48px; margin-top:20px; border:0; border-radius:8px;
      background:#2563A6; color:white; font-weight:700; font-size:1rem; }
    button:disabled { opacity:.55; }
    button:focus-visible,input:focus-visible { outline:3px solid #B7791F; outline-offset:3px; }
    @media (max-width:480px) { .page { padding:12px; } .panel { padding:18px; } }
  `]
})
export class AuthorizationResponseComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  readonly view = signal<AuthorizationView | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly completed = signal(false);
  readonly decision = signal<'AUTHORIZED' | 'NOT_AUTHORIZED' | null>(null);
  readonly confirmed = signal(false);
  readonly submitting = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const result = await firstValueFrom(
        this.http.get<AuthorizationView>(`/api/public/authorizations/${encodeURIComponent(this.token)}`)
      );
      this.view.set(result);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    if (!this.decision() || !this.confirmed() || this.submitting()) return;
    this.submitting.set(true);
    try {
      await firstValueFrom(this.http.post(
        `/api/public/authorizations/${encodeURIComponent(this.token)}/response`,
        { decision: this.decision(), confirmed: true }
      ));
      this.completed.set(true);
    } catch {
      this.error.set(true);
    } finally {
      this.submitting.set(false);
    }
  }
}
