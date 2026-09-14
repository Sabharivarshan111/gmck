#!/usr/bin/env python3
"""
Generate Biophysical Foundations & Mathematical Formulations Monograph
Orbit Virtual Patient Simulator & 3D Anatomy Engine
Publication-Grade ReportLab + Matplotlib MathText Typography
"""

import os
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib_cache"
import sys
import io
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image as PILImage

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Image as RLImage
)
from reportlab.pdfgen import canvas

# Cache for rendered equation flowables to avoid redundant renders
equation_cache = {}

def render_math_flowable(latex_expr, fontsize=15.5, color="#0f172a", bg_color="#f8fafc", max_height=46):
    """
    Render a LaTeX math expression into a high-DPI (300 DPI) publication-grade PNG
    using Matplotlib's native MathText engine, and wrap it into a ReportLab Image flowable.
    """
    cache_key = (latex_expr, fontsize, color, bg_color)
    if cache_key in equation_cache:
        buf, w, h = equation_cache[cache_key]
        buf.seek(0)
        return RLImage(buf, width=w, height=h)

    # Clean expression for mathtext
    clean_expr = latex_expr.strip()
    # Replace unsupported commands
    clean_expr = clean_expr.replace(r"\implies", r"\Rightarrow")
    clean_expr = clean_expr.replace(r"\text{", r"\mathrm{")
    if not clean_expr.startswith("$"):
        clean_expr = f"${clean_expr}$"

    fig = plt.figure(figsize=(8.0, 1.05), dpi=300)
    fig.patch.set_facecolor(bg_color)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.axis("off")
    ax.patch.set_facecolor(bg_color)

    ax.text(
        0.5, 0.5, clean_expr,
        horizontalalignment="center", verticalalignment="center",
        fontsize=fontsize, color=color
    )

    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0.06, facecolor=bg_color, dpi=300)
    plt.close(fig)
    buf.seek(0)

    # Calculate proportional dimensions in ReportLab points (72 points/inch)
    pil_img = PILImage.open(buf)
    img_w, img_h = pil_img.size
    aspect = img_w / max(1, img_h)

    # Scale to fit nicely in 480pt column
    target_h = min(max_height, max(22, img_h * 72.0 / 300.0 * 1.25))
    target_w = target_h * aspect
    if target_w > 470:
        target_w = 470
        target_h = target_w / aspect

    buf.seek(0)
    equation_cache[cache_key] = (buf, target_w, target_h)
    return RLImage(buf, width=target_w, height=target_h)


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print total page count 'Page X of Y'
    along with running header and footer.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Omit headers on cover page
        if self._pageNumber > 1:
            # Running Header
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(54, letter[1] - 36, "ORBIT MBBS SIMULATOR — BIOPHYSICAL FOUNDATIONS & MATHEMATICAL MONOGRAPH")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

        # Running Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — ORBIT MEDICAL SYSTEMS")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 36, page_str)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 46, letter[0] - 54, 46)

        self.restoreState()


def build_pdf(filename="docs/Biophysical_Foundations_of_Virtual_Patient_Simulation.pdf"):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0f172a")     # Deep Slate 900
    SECONDARY = colors.HexColor("#1e3a8a")   # Rich Blue 900
    ACCENT = colors.HexColor("#0284c7")      # Cyan 600
    CRIMSON = colors.HexColor("#991b1b")     # Deep Crimson 800
    DARK_TEXT = colors.HexColor("#1e293b")   # Slate 800
    MUTED_TEXT = colors.HexColor("#475569")  # Slate 600
    CARD_BG = colors.HexColor("#f8fafc")     # Slate 50
    CARD_BORDER = colors.HexColor("#e2e8f0") # Slate 200
    FORMULA_BG = colors.HexColor("#f8fafc")  # Off-white

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=23,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11.5,
        leading=16,
        textColor=SECONDARY,
        spaceAfter=18
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=MUTED_TEXT
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceBefore=10,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=DARK_TEXT,
        spaceAfter=6
    )

    formula_desc_style = ParagraphStyle(
        'FormulaDesc',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=MUTED_TEXT,
        alignment=1, # Center
        spaceBefore=3
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=DARK_TEXT
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=DARK_TEXT
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=PRIMARY
    )

    story = []

    def make_formula_box(eq_latex, explanation="", max_height=34):
        """
        Generates a publication-grade mathematical formula block with an embedded
        high-DPI rendered equation image and optional descriptive caption.
        """
        img_flowable = render_math_flowable(eq_latex, fontsize=12.5, max_height=max_height)
        flowables = [img_flowable]
        if explanation:
            p_desc = Paragraph(explanation, formula_desc_style)
            flowables.append(p_desc)
        t = Table([[flowables]], colWidths=[500])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), FORMULA_BG),
            ('BOX', (0, 0), (-1, -1), 0.75, CARD_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        return t

    def make_callout(text, bg_color=CARD_BG, border_color=ACCENT):
        p = Paragraph(text, callout_style)
        t = Table([[p]], colWidths=[500])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg_color),
            ('BOX', (0, 0), (-1, -1), 1.0, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ]))
        return t

    # =========================================================================
    # COVER / HEADER
    # =========================================================================
    story.append(Paragraph("ORBIT VIRTUAL PATIENT SIMULATOR", ParagraphStyle('SubTag', fontName='Helvetica-Bold', fontSize=10, leading=12, textColor=ACCENT, spaceAfter=6)))
    story.append(Paragraph("Biophysical Foundations & Mathematical Derivations Monograph", title_style))
    story.append(Paragraph("A Continuous Mathematical Compendium of Hemodynamics, Electrophysiology, Fluid Mechanics, Bioacoustics, and WebGL Systems", subtitle_style))
    
    meta_box = [
        [
            Paragraph("<b>Author / Architecture:</b> Orbit Medical Engineering Group<br/><b>Target Curriculum:</b> NMC CBME, Harrison's, Guyton & Hall, Braunwald<br/><b>Monograph Reference:</b> ORBIT-BIO-MATH-2026-V1", meta_style),
            Paragraph("<b>Mathematical Class:</b> Multi-Scale Coupled ODEs & PDEs<br/><b>Execution Kernel:</b> 100 Hz Modified Nodal Analysis<br/><b>Classification:</b> High-Fidelity Clinical Simulator", meta_style)
        ]
    ]
    t_meta = Table(meta_box, colWidths=[250, 250])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 1, CARD_BORDER),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 12))

    # =========================================================================
    # SECTION 1: EXECUTIVE PREAMBLE & MODELING PARADIGM
    # =========================================================================
    story.append(Paragraph("1. Executive Preamble: Continuous First-Principles Modeling", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceAfter=8))
    
    story.append(Paragraph(
        "Contemporary medical simulators frequently rely on discrete state-machine heuristics or coarse rule-based "
        "lookups (e.g., if blood loss &gt; 1000 mL, reduce systolic blood pressure by 25 mmHg). While computationally "
        "trivial, such empirical approximations break down during complex multi-organ pathology, drug-disease "
        "interactions, and dynamic resuscitation. The <b>Orbit Virtual Patient Simulator</b> rejects phenomenological "
        "shortcuts in favor of <b>continuous, closed-loop biophysical models grounded in classical conservation laws</b>.",
        body_style
    ))
    story.append(Paragraph(
        "Every physiological variable in Orbit—from left ventricular pressure trajectories to 12-lead surface ECG voltages, "
        "sub-valvular acoustic shear flutter, and trans-microvascular glycocalyx fluid exchange—arises deterministically "
        "from coupled ordinary and partial differential equations (ODEs/PDEs). This document provides the formal mathematical "
        "derivations, mechanical analogies, dimensional validations, and primary literature citations supporting Orbit's engine.",
        body_style
    ))
    story.append(Spacer(1, 6))

    # =========================================================================
    # SECTION 2: CARDIOVASCULAR HEMODYNAMICS & VENTRICULAR MECHANICS
    # =========================================================================
    story.append(Paragraph("2. Cardiovascular Hemodynamics & Ventricular Mechanics", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceAfter=8))

    story.append(Paragraph("2.1. The Wiggers Diagram & Cardiac Cycle Phase Mechanics", h2_style))
    story.append(Paragraph(
        "The cardiac cycle represents the periodic conversion of biochemical cross-bridge potential energy into mechanical "
        "stroke work and hydraulic arterial pressure. Carl J. Wiggers (1915) synthesized the temporal relationship between "
        "intracardiac pressures, ventricular volumes, electrograms, and heart sounds into seven distinct mechanical phases:",
        body_style
    ))

    # Wiggers phases table
    wiggers_data = [
        [Paragraph("Phase", table_header_style), Paragraph("Mechanical State", table_header_style), Paragraph("A-V Valves", table_header_style), Paragraph("SL Valves", table_header_style), Paragraph("Governing Dynamics", table_header_style)],
        [Paragraph("1. Atrial Systole", table_cell_style), Paragraph("Active ventricular topping-up (~15-20% EDV)", table_cell_style), Paragraph("Open", table_cell_style), Paragraph("Closed", table_cell_style), Paragraph("Atrial booster pump; a-wave on CVP; S4 in stiff LV", table_cell_style)],
        [Paragraph("2. Isovolumetric Contraction", table_cell_style), Paragraph("Rapid dP/dt pressure spike; volume fixed", table_cell_style), Paragraph("Closed (M1/T1)", table_cell_style), Paragraph("Closed", table_cell_style), Paragraph("P_LV rises 10 -&gt; 80 mmHg; S1 sound generated", table_cell_style)],
        [Paragraph("3. Rapid Ejection", table_cell_style), Paragraph("Accelerating aortic inflow; max LV pressure", table_cell_style), Paragraph("Closed", table_cell_style), Paragraph("Open", table_cell_style), Paragraph("Inertial blood acceleration; peak systolic pressure", table_cell_style)],
        [Paragraph("4. Reduced Ejection", table_cell_style), Paragraph("Decelerating inflow; ventricular repolarization", table_cell_style), Paragraph("Closed", table_cell_style), Paragraph("Open", table_cell_style), Paragraph("Aortic pressure exceeds LV; run-off into periphery", table_cell_style)],
        [Paragraph("5. Isovolumetric Relaxation", table_cell_style), Paragraph("Exponential pressure decay (-dP/dt); volume fixed", table_cell_style), Paragraph("Closed", table_cell_style), Paragraph("Closed (A2/P2)", table_cell_style), Paragraph("Dicrotic notch / incisura; S2 sound generated", table_cell_style)],
        [Paragraph("6. Rapid Ventricular Filling", table_cell_style), Paragraph("Passive suction filling; rapid volume influx", table_cell_style), Paragraph("Open", table_cell_style), Paragraph("Closed", table_cell_style), Paragraph("Elastic recoil suction; S3 gallop if volume overload", table_cell_style)],
        [Paragraph("7. Diastasis (Reduced Filling)", table_cell_style), Paragraph("Passive venous conduit flow; slow filling", table_cell_style), Paragraph("Open", table_cell_style), Paragraph("Closed", table_cell_style), Paragraph("Filling rate asymptotically approaches zero", table_cell_style)]
    ]
    t_wiggers = Table(wiggers_data, colWidths=[80, 110, 60, 60, 190])
    t_wiggers.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), SECONDARY),
        ('GRID', (0, 0), (-1, -1), 0.5, CARD_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, CARD_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_wiggers)
    story.append(Spacer(1, 8))

    story.append(Paragraph("2.2. Time-Varying Ventricular Elastance Model: E(t)", h2_style))
    story.append(Paragraph(
        "To model ventricular pump action without imposing an unphysiological constant-pressure or constant-flow source, "
        "Orbit implements the seminal <b>time-varying elastance formulation</b> established by Hiroyuki Suga and Kiichi Sagawa (1974). "
        "The instantaneous pressure generated within the left or right ventricular cavity is expressed as a dynamic linear elastance "
        "operator acting upon the volume above a stress-free unstressed volume <i>V</i><sub>0</sub>:",
        body_style
    ))

    story.append(make_formula_box(
        r"P_{lv}(t) = E(t) \cdot [V_{lv}(t) - V_0]",
        "Where E(t) [mmHg/mL] is instantaneous chamber elastance, and V_0 [mL] is unstressed cavity volume."
    ))

    story.append(Paragraph(
        "The elastance function <i>E</i>(<i>t</i>) shifts periodically between a low passive diastolic compliance <i>E</i><sub>d</sub> "
        "and a high active inotropic peak <i>E</i><sub>es</sub> (end-systolic elastance). Normalized time-varying elastance "
        "<i>E</i><sub>N</sub>(<i>t</i><sub>N</sub>) displays a remarkable invariance across inotropic states, heart rates, and species, parameterized via the Double-Hill activation equation:",
        body_style
    ))

    story.append(make_formula_box(
        r"E_N(t_N) = 1.55 \left[ \frac{(t_N / 0.7)^a}{1 + (t_N / 0.7)^a} \right] \left[ \frac{1}{1 + (t_N / 1.17)^b} \right]",
        "Double-Hill normalized elastance operator where t_N = t / T_max is normalized cycle time."
    ))

    story.append(Paragraph(
        "<b>Physiological Significance:</b> When contractility increases (e.g., inotropic stimulation with Dobutamine or Norepinephrine), "
        "<i>E</i><sub>es</sub> rotates counter-clockwise with a steeper slope, elevating stroke volume and peak systolic pressure without altering <i>V</i><sub>0</sub>. "
        "Conversely, cardiogenic shock and ischemic heart failure flatten <i>E</i><sub>es</sub>, collapsing stroke volume and elevating end-systolic volume.",
        body_style
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("2.3. End-Diastolic Pressure-Volume Relationship (EDPVR) & Frank-Starling Law", h2_style))
    story.append(Paragraph(
        "During diastole, the myocardium behaves as a nonlinear, viscoelastic hyperelastic tissue. As sarcomeres stretch, "
        "titin filaments and the extracellular collagen matrix resist further distension, yielding an exponential relationship:",
        body_style
    ))

    story.append(make_formula_box(
        r"\mathrm{EDPVR:\ } P_{ed} = P_0 (e^{\beta V_{ed}} - 1) \quad \mathrm{vs} \quad \mathrm{ESPVR:\ } P_{es} = E_{es}(V_{es} - V_0)",
        "Nonlinear exponential diastolic compliance EDPVR contrasted with linear systolic elastance ESPVR."
    ))

    story.append(Paragraph(
        "<b>The Frank-Starling Mechanism:</b> Increased venous return augments end-diastolic volume (preload), stretching myocytes closer "
        "to optimal sarcomere overlap (<i>L</i><sub>0</sub> ≈ 2.2 μm). This enhances troponin C affinity for Ca<sup>2+</sup>, "
        "automatically magnifying contractile force on the subsequent beat without neural input.",
        body_style
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("2.4. Stroke Work & Ventricular Pressure-Volume Area (PVA)", h2_style))
    story.append(Paragraph(
        "Mechanical ventricular work performed per cardiac beat is the integral of ventricular pressure across stroke volume, "
        "corresponding geometrically to the area enclosed by the PV loop:",
        body_style
    ))

    story.append(make_formula_box(
        r"SW = \oint P(t)\, dV = \int_{EDV}^{ESV} P_{lv}\, dV_{lv}",
        "Ventricular stroke work computed as the closed contour integral of intraventricular pressure over volume."
    ))
    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION 3: VASCULAR FLUID DYNAMICS & CORONARY CIRCULATION
    # =========================================================================
    story.append(Paragraph("3. Vascular Fluid Dynamics & Hemodynamic Resistance", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceAfter=8))

    story.append(Paragraph("3.1. Incompressible Navier-Stokes Equations for Arterial Blood Flow", h2_style))
    story.append(Paragraph(
        "Blood is modeled as an incompressible Newtonian fluid (or Casson fluid in microvessels) obeying the Navier-Stokes momentum conservation equations:",
        body_style
    ))

    story.append(make_formula_box(
        r"\rho \left( \frac{\partial \mathbf{u}}{\partial t} + (\mathbf{u} \cdot \nabla)\mathbf{u} \right) = -\nabla p + \mu \nabla^2 \mathbf{u} + \mathbf{f}",
        "Where density rho = 1060 kg/m^3, dynamic viscosity mu = 0.0035 Pa.s, and p is hydraulic pressure."
    ))

    story.append(Paragraph("3.2. Hagen-Poiseuille Resistance Derivation & Vessel Caliber Scaling", h2_style))
    story.append(Paragraph(
        "Jean Léonard Marie Poiseuille (1840) derived the analytical solution for laminar steady flow through a cylindrical conduit of radius <i>r</i> and length <i>L</i>. "
        "By integrating viscous shear stress τ = -μ(d<i>u</i>/d<i>r</i>) across concentric cylindrical fluid shells, the total volumetric flow rate <i>Q</i> is:",
        body_style
    ))

    story.append(make_formula_box(
        r"Q = \frac{\pi r^4 \Delta P}{8 \mu L} \quad \Rightarrow \quad R_{hyd} = \frac{\Delta P}{Q} = \frac{8 \mu L}{\pi r^4}",
        "Hagen-Poiseuille hydraulic resistance equation highlighting inverse fourth-power radius dependence."
    ))

    story.append(make_callout(
        "<b>Clinical Impact of the 4th Power Law:</b> Because resistance scales inversely with the fourth power (<i>R</i> ∝ <i>r</i><sup>-4</sup>), "
        "a <b>16% reduction in arteriolar radius halves blood flow</b> (0.84<sup>4</sup> ≈ 0.50). Conversely, a 50% stenosis in a coronary artery "
        "increases vascular resistance by <b>16-fold</b>, producing severe exercise-induced angina and subendocardial ischemia.",
        bg_color=CARD_BG,
        border_color=CRIMSON
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("3.3. Womersley Number & Pulsatile Flow Regimes", h2_style))
    story.append(Paragraph(
        "In large conduit vessels (ascending aorta, carotid arteries), blood flow is strongly pulsatile and inertia dominates over viscous forces. "
        "The dimensionless <b>Womersley number</b> α characterizes the frequency-dependent velocity profile:",
        body_style
    ))

    story.append(make_formula_box(
        r"\alpha = r \sqrt{\frac{\omega \rho}{\mu}} = r \sqrt{\frac{2 \pi f \rho}{\mu}}",
        "Where alpha > 10 in human aorta (flat/plug-like velocity profile), and alpha < 1 in arterioles (parabolic Poiseuille flow)."
    ))

    story.append(Paragraph("3.4. Reynolds Number & Turbulence Transition", h2_style))
    story.append(Paragraph(
        "Transition from quiet laminar streamlines to chaotic turbulent eddies occurs when inertial forces overwhelm viscous damping, "
        "governed by the dimensionless <b>Reynolds number</b> Re:",
        body_style
    ))

    story.append(make_formula_box(
        r"Re = \frac{\rho v D}{\mu} = \frac{v D}{\nu}",
        "Critical Reynolds number in smooth cylindrical tubes is Re_crit approx 2300 (exceeded in aortic stenosis)."
    ))

    story.append(Paragraph("3.5. Murray's Law of Vascular Branching", h2_style))
    story.append(Paragraph(
        "Cecil D. Murray (1926) proved that the vascular tree minimizes total biological work (viscous dissipation work plus metabolic "
        "tissue maintenance cost of blood volume) when parent vessel radius <i>r</i><sub>0</sub> relates to daughter radii via a cubic power law:",
        body_style
    ))

    story.append(make_formula_box(
        r"r_0^3 = \sum_{i=1}^n r_i^3 = r_1^3 + r_2^3",
        "Murray's cubic branching law governing anatomical arborization in coronary and systemic arterial trees."
    ))
    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION 4: CARDIAC ELECTROPHYSIOLOGY & 12-LEAD VECTORCARDIOGRAPHY
    # =========================================================================
    story.append(Paragraph("4. Cardiac Electrophysiology & 12-Lead Electrocardiography", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceAfter=8))

    story.append(Paragraph("4.1. Sarcolemmal Ionic Gradients & Goldman-Hodgkin-Katz (GHK) Equation", h2_style))
    story.append(Paragraph(
        "Resting and active cardiomyocyte membrane potentials (<i>V</i><sub>m</sub>) arise from selective ionic permeabilities (<i>P</i><sub>K</sub>, <i>P</i><sub>Na</sub>, <i>P</i><sub>Ca</sub>, <i>P</i><sub>Cl</sub>) "
        "and asymmetrical trans-sarcolemmal concentration gradients maintained by Na<sup>+</sup>/K<sup>+</sup>-ATPase pumps:",
        body_style
    ))

    story.append(make_formula_box(
        r"V_m = \frac{RT}{F} \ln \left( \frac{P_{K}[\mathrm{K}^+]_o + P_{Na}[\mathrm{Na}^+]_o + P_{Cl}[\mathrm{Cl}^-]_i}{P_{K}[\mathrm{K}^+]_i + P_{Na}[\mathrm{Na}^+]_i + P_{Cl}[\mathrm{Cl}^-]_o} \right)",
        "Goldman-Hodgkin-Katz (GHK) voltage equation for resting and depolarized membrane potential."
    ))

    story.append(Paragraph("4.2. 1D Cable Theory of Myocardial Conduction", h2_style))
    story.append(Paragraph(
        "Cardiac action potential propagation through gap-junction-coupled syncytial trabeculae obeys the classical cable equation:",
        body_style
    ))

    story.append(make_formula_box(
        r"\lambda^2 \frac{\partial^2 V_m}{\partial x^2} - \tau_m \frac{\partial V_m}{\partial t} - V_m = 0, \quad \lambda = \sqrt{\frac{r_m}{r_i + r_o}}, \quad \tau_m = r_m c_m",
        "Space constant lambda [mm] and membrane time constant tau_m [ms] dictating conduction velocity theta proportional to lambda / tau_m."
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("4.3. Einthoven's Triangle & Dipole Field Projection onto 12 Leads", h2_style))
    story.append(Paragraph(
        "Willem Einthoven (1906) demonstrated that total electrical cardiac activity can be modeled as an instantaneous equivalent "
        "dipole vector <b>D</b>(<i>t</i>) = [<i>D</i><sub>x</sub>(<i>t</i>), <i>D</i><sub>y</sub>(<i>t</i>), <i>D</i><sub>z</sub>(<i>t</i>)]<sup>T</sup> in 3D torso space. Any lead potential <i>V</i><sub>lead</sub>(<i>t</i>) represents the "
        "scalar projection of this cardiac dipole onto the standardized lead vector <b>L</b><sub>lead</sub>:",
        body_style
    ))

    story.append(make_formula_box(
        r"V_{lead}(t) = \mathbf{D}(t) \cdot \mathbf{L}_{lead} = D_x L_x + D_y L_y + D_z L_z",
        "Fundamental vectorcardiographic lead projection theorem."
    ))

    story.append(Paragraph(
        "<b>Wilson Central Terminal (WCT):</b> Frank N. Wilson (1946) established a virtual zero-potential reference for the precordial leads "
        "by connecting the three limb electrodes (Right Arm <i>V</i><sub>R</sub>, Left Arm <i>V</i><sub>L</sub>, Left Leg <i>V</i><sub>F</sub>) through equal 5 kΩ resistors:",
        body_style
    ))

    story.append(make_formula_box(
        r"V_{WCT} = \frac{V_R + V_L + V_F}{3} \equiv 0\,\mathrm{mV}",
        "Wilson Central Terminal virtual reference node."
    ))

    story.append(Paragraph(
        "<b>Goldberger Augmented Limb Leads:</b> Emanuel Goldberger (1942) removed the connection from the explored limb to the central terminal, "
        "augmenting signal voltage by 50% (1.5x):",
        body_style
    ))

    story.append(make_formula_box(
        r"aVR = V_R - \frac{V_L + V_F}{2}, \quad aVL = V_L - \frac{V_R + V_F}{2}, \quad aVF = V_F - \frac{V_R + V_L}{2}",
        "Goldberger augmented unipolar limb leads."
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("4.4. Ischemic Injury Current & Reciprocal ST-Segment Mechanics", h2_style))
    story.append(Paragraph(
        "During acute transmural myocardial infarction (STEMI), ischemic cardiomyocytes lose intracellular potassium ([K<sup>+</sup>]<sub>o</sub> rises), "
        "partially depolarizing resting potential from -90 mV to -60 mV and shortening action potential duration. "
        "This creates a continuous systolic injury dipole vector Δ<b>D</b><sub>ischemia</sub> pointing from normal myocardium toward the ischemic zone:",
        body_style
    ))

    story.append(make_formula_box(
        r"\Delta V_{ST} = \Delta \mathbf{D}_{ischemia} \cdot \mathbf{L}_{lead}",
        "Injury current vector producing ST-elevation in facing leads and reciprocal ST-depression in opposite leads."
    ))

    story.append(Paragraph(
        "<b>Example:</b> In Acute Inferior STEMI (Right Coronary Artery occlusion), Δ<b>D</b><sub>ischemia</sub> points downward and backward (+100°). "
        "This aligns positively with leads II (+60°), III (+120°), and aVF (+90°) causing marked ST elevation (+3 to +5 mm), "
        "while projecting negatively onto high lateral leads I (0°) and aVL (-30°) causing reciprocal ST depression (-2 to -4 mm).",
        body_style
    ))
    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION 5: CLINICAL BIOACOUSTICS & MURMUR SYNTHESIS
    # =========================================================================
    story.append(Paragraph("5. Clinical Bioacoustics & Stethoscope Audio Synthesis", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceAfter=8))

    story.append(Paragraph("5.1. Damped Harmonic Oscillator Model for Valvar Heart Sounds (S1 & S2)", h2_style))
    story.append(Paragraph(
        "Heart sounds (S1, S2, S3, S4) do not arise from valve leaflets clapping together like doors; rather, they represent "
        "the sudden deceleration of blood volume against taut, closed valve curtains, driving the entire cardio-hemic system into damped acoustic oscillation:",
        body_style
    ))

    story.append(make_formula_box(
        r"m \frac{d^2 x}{dt^2} + c \frac{dx}{dt} + k x = F(t) \quad \Rightarrow \quad x(t) = A_0 e^{-\zeta \omega_n t} \sin(\omega_d t + \phi)",
        "Damped second-order acoustic oscillator where omega_n = sqrt(k/m) is natural frequency and zeta is damping ratio."
    ))

    story.append(Paragraph(
        "In Orbit's audio engine, <b>S1</b> (Mitral/Tricuspid closure) is synthesized as a low-frequency damped wave (40-70 Hz, duration 100-120 ms, ζ ≈ 0.18), "
        "whereas <b>S2</b> (Aortic/Pulmonic closure) exhibits higher stiffness and lower vibrating mass, yielding higher frequency (80-120 Hz, duration 70-90 ms, ζ ≈ 0.22).",
        body_style
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("5.2. Curle's Aeroacoustic Dipole Radiation Equation for Murmurs", h2_style))
    story.append(Paragraph(
        "Turbulent flow through stenotic or regurgitant orifices generates pressure fluctuations across solid boundaries (valve leaflets, ventricular walls). "
        "N. Curle (1955) extended Lighthill's acoustic analogy to incorporate rigid boundaries, demonstrating that fluctuating surface forces <i>F</i><sub>i</sub> act as acoustic dipoles:",
        body_style
    ))

    story.append(make_formula_box(
        r"p^{\prime}(\mathbf{x}, t) \approx \frac{1}{4 \pi c_0 r} \int_S \left[ \frac{\partial F_i(\mathbf{y}, t^{\prime})}{\partial t} \right]_{t^{\prime} = t - r/c_0} \frac{x_i}{r} dS(\mathbf{y})",
        "Curle's acoustic dipole radiation equation for murmur generation at fluid-solid interfaces."
    ))

    story.append(Paragraph(
        "<b>Acoustic Power Scaling:</b> Curle's equation dictates that the radiated acoustic sound power <i>W</i><sub>sound</sub> scales with the sixth power of jet velocity:",
        body_style
    ))

    story.append(make_formula_box(
        r"W_{sound} \propto \frac{\rho_0 u_{jet}^6 L^2}{c_0^3}",
        "Sixth-power acoustic velocity scaling law for cardiac murmurs."
    ))

    story.append(Paragraph(
        "Because velocity across a stenotic valve scales with pressure drop via the Gorlin/Torricelli equation (<i>u</i><sub>jet</sub> = √(2Δ<i>P</i>/ρ)), "
        "even modest elevations in transvalvular gradient Δ<i>P</i> cause exponential surges in high-frequency murmur loudness.",
        body_style
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("5.3. Verified Hemodynamic Timing & Acoustic Spectral Envelopes", h2_style))
    story.append(Paragraph(
        "Orbit's Web Audio DSP engine simulates distinct clinical murmurs with authentic spectral shaping and chest-wall formant resonance:",
        body_style
    ))

    murmur_table_data = [
        [Paragraph("Pathology", table_header_style), Paragraph("Timing in Cycle", table_header_style), Paragraph("Spectral Center", table_header_style), Paragraph("Envelope Profile", table_header_style), Paragraph("Auscultation Site & Radiation", table_header_style)],
        [Paragraph("Aortic Stenosis", table_cell_style), Paragraph("Systolic ejection (mid-systole)", table_cell_style), Paragraph("200 - 550 Hz (Harsh)", table_cell_style), Paragraph("Diamond crescendo-decrescendo", table_cell_style), Paragraph("2nd R ICS; radiates to carotids", table_cell_style)],
        [Paragraph("Mitral Regurgitation", table_cell_style), Paragraph("Holosystolic / Pansystolic", table_cell_style), Paragraph("250 - 650 Hz (Blowing)", table_cell_style), Paragraph("Flat rectangular plateau", table_cell_style), Paragraph("Apex (mitral); radiates to axilla", table_cell_style)],
        [Paragraph("Aortic Regurgitation", table_cell_style), Paragraph("Early diastole (post-A2)", table_cell_style), Paragraph("300 - 750 Hz (High-pitch)", table_cell_style), Paragraph("Immediate decrescendo", table_cell_style), Paragraph("Erb's point (3rd L ICS) leaning forward", table_cell_style)],
        [Paragraph("Mitral Stenosis", table_cell_style), Paragraph("Mid-diastolic with pre-systolic", table_cell_style), Paragraph("60 - 160 Hz (Low rumble)", table_cell_style), Paragraph("OS -&gt; low rumble -&gt; atrial kick", table_cell_style), Paragraph("Apex in left lateral decubitus (Bell)", table_cell_style)],
        [Paragraph("Friction Rub", table_cell_style), Paragraph("Triphasic (Atrial, Vent, Filling)", table_cell_style), Paragraph("350 - 900 Hz (Scratchy)", table_cell_style), Paragraph("High-frequency superficial burst", table_cell_style), Paragraph("Lower left sternal border held in exp", table_cell_style)]
    ]
    t_murmur = Table(murmur_table_data, colWidths=[85, 95, 80, 105, 135])
    t_murmur.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), SECONDARY),
        ('GRID', (0, 0), (-1, -1), 0.5, CARD_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, CARD_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_murmur)
    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION 6: WEBGL SHADER DISCARD & MOBILE STABILITY
    # =========================================================================
    story.append(Paragraph("6. WebGL Shader Mathematics & Mobile Stability Architecture", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceAfter=8))

    story.append(Paragraph("6.1. Dynamic Shader Discard vs Mesh Allocation Overheads", h2_style))
    story.append(Paragraph(
        "Rendering 2,234 segmented anatomical structures on mobile Safari/WebKit without memory exhaustion requires eliminating "
        "Three.js mesh allocation churn. In Orbit, all segmented structures within an organ system are merged into a single <code>BufferGeometry</code>. "
        "A per-vertex attribute <code>partIndex</code> flags structure identity. In the fragment shader:",
        body_style
    ))

    story.append(make_formula_box(
        r"\mathrm{Fragment\ Shader:\ \ if}\;(vVisibility < 0.5)\;\mathrm{discard};",
        "Early-Z fragment discard rejected at rasterization stage with zero CPU draw call overhead."
    ))

    story.append(Paragraph("6.2. Mobile Jetsam Out-of-Memory (OOM) Prevention Protocol", h2_style))
    story.append(Paragraph(
        "Mobile WebKit imposes strict per-tab memory ceilings (typically 280MB - 350MB). Concurrent uncompressed ArrayBuffers and "
        "unbounded <code>DecompressionStream</code> pipelines trigger instant Jetsam kills. Orbit implements four structural guardrails:",
        body_style
    ))

    oom_guardrails = [
        [Paragraph("Mechanism", table_header_style), Paragraph("Vulnerability Prevented", table_header_style), Paragraph("Technical Specification", table_header_style)],
        [Paragraph("Sequential Chunk Throttling", table_cell_bold), Paragraph("Peak heap allocation spikes during concurrent fetches", table_cell_style), Paragraph("Batch size = 3 chunks; <code>setTimeout(0)</code> yield after each chunk decompression", table_cell_style)],
        [Paragraph("Clamped Device Pixel Ratio", table_cell_bold), Paragraph("Retina 3x/4x framebuffer VRAM exhaustion", table_cell_style), Paragraph("<code>setPixelRatio(min(dpr, isMobile ? 1.0 : 1.75))</code>", table_cell_style)],
        [Paragraph("ArrayBuffer Disposal", table_cell_bold), Paragraph("Double buffering in JavaScript heap", table_cell_style), Paragraph("Immediate garbage collection via transferables; zero retained binary buffers", table_cell_style)],
        [Paragraph("Context Loss Handler", table_cell_bold), Paragraph("Permanent black-screen crash on GPU eviction", table_cell_style), Paragraph("<code>webglcontextlost</code> / <code>webglcontextrestored</code> automatic reinitialization loop", table_cell_style)]
    ]
    t_oom = Table(oom_guardrails, colWidths=[120, 150, 230])
    t_oom.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), SECONDARY),
        ('GRID', (0, 0), (-1, -1), 0.5, CARD_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, CARD_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_oom)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 7: PRIMARY LITERATURE BIBLIOGRAPHY
    # =========================================================================
    story.append(Paragraph("7. Primary Literature Citations & Foundational References", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceAfter=8))

    citations = [
        ("1", "Einthoven, W. (1906)", "Le télécardiogramme. <i>Archives Internationales de Physiologie</i>, 4(2), 132-164. [Introduced string galvanometer, limb leads I-III, and dipole vector concept]."),
        ("2", "Wiggers, C. J. (1915)", "The contour of the normal arterial pulse. <i>JAMA</i>, 64(18), 1485-1487. [Seminal synthesis of synchronized cardiac pressure-volume-acoustic cycles]."),
        ("3", "Suga, H., & Sagawa, K. (1974)", "Instantaneous pressure-volume relationships and their ratio in the excised, supported canine left ventricle. <i>Circulation Research</i>, 35(1), 117-126. [Time-varying elastance E(t) formulation]."),
        ("4", "Poiseuille, J. L. M. (1840)", "Recherches expérimentales sur le mouvement des liquides dans les tubes de très-petits diamètres. <i>Comptes Rendus de l'Académie des Sciences</i>, 11, 961-967. [Laminar flow fourth-power law]."),
        ("5", "Murray, C. D. (1926)", "The physiological principle of minimum work: I. The vascular system and the cost of blood volume. <i>PNAS</i>, 12(3), 207-214. [Cubic vascular branching law]."),
        ("6", "Wilson, F. N., et al. (1946)", "The precordial electrocardiogram. <i>American Heart Journal</i>, 27(1), 19-85. [Wilson Central Terminal and standard precordial V1-V6 leads]."),
        ("7", "Goldberger, E. (1942)", "A simple, indifferent, electrocardiographic electrode of zero potential and a technique of obtaining augmented, unipolar, extremity leads. <i>American Heart Journal</i>, 23(4), 483-492. [Augmented leads aVR, aVL, aVF]."),
        ("8", "Curle, N. (1955)", "The influence of solid boundaries upon aerodynamic sound. <i>Proc. R. Soc. Lond. A</i>, 231(1187), 505-514. [Aeroacoustic dipole radiation theory for cardiac murmurs]."),
        ("9", "Westerhof, N., et al. (1971)", "Artificial arterial system for pumping hearts. <i>Journal of Applied Physiology</i>, 31(5), 776-781. [4-element Windkessel vascular impedance model]."),
        ("10", "Goldman, D. E. (1943)", "Potential, impedance, and rectification in membranes. <i>The Journal of General Physiology</i>, 27(1), 37-60. [GHK constant-field voltage equation]."),
        ("11", "Hodgkin, A. L., & Katz, B. (1949)", "The effect of sodium ions on the electrical activity of the giant axon of the squid. <i>The Journal of Physiology</i>, 108(1), 37-77. [Permeability ratio formulations]."),
        ("12", "Guyton, A. C., & Hall, J. E. (2020)", "<i>Textbook of Medical Physiology</i> (14th ed.). Elsevier. [Venous return curves, cardiac output equilibrium, and microvascular exchange]."),
        ("13", "Braunwald, E., et al. (2022)", "<i>Braunwald's Heart Disease: A Textbook of Cardiovascular Medicine</i> (12th ed.). Elsevier. [STEMI vector currents and valvular hemodynamics]."),
        ("14", "Harrison, T. R., et al. (2022)", "<i>Harrison's Principles of Internal Medicine</i> (21st ed.). McGraw-Hill. [Clinical auscultation acoustics and Bedside PICCLED physical exam].")
    ]

    cite_table_data = []
    for num, auth, desc in citations:
        cite_table_data.append([
            Paragraph(f"<b>[{num}]</b>", table_cell_bold),
            Paragraph(f"<b>{auth}</b> — {desc}", table_cell_style)
        ])

    t_cite = Table(cite_table_data, colWidths=[30, 470])
    t_cite.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, CARD_BORDER),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, CARD_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_cite)
    story.append(Spacer(1, 14))

    # Build document using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Monograph PDF successfully compiled to: {filename}")


if __name__ == "__main__":
    out_path = sys.argv[1] if len(sys.argv) > 1 else "docs/Biophysical_Foundations_of_Virtual_Patient_Simulation.pdf"
    build_pdf(out_path)
