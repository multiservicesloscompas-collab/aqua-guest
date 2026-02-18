# Diagramas de Flujo - AquaGuest

Este documento contiene los diagramas de flujo de los procesos principales del sistema AquaGuest.

## Índice
1. [Flujo de Venta de Agua](#flujo-de-venta-de-agua)
2. [Flujo de Alquiler de Lavadora](#flujo-de-alquiler-de-lavadora)
3. [Flujo de Agua Prepagada](#flujo-de-agua-prepagada)
4. [Flujo de Configuración de Tasa](#flujo-de-configuración-de-tasa)
5. [Flujo de Gestión de Clientes](#flujo-de-gestión-de-clientes)
6. [Flujo de Seguimiento de Alquileres](#flujo-de-seguimiento-de-alquileres)
7. [Flujo de Extensión de Alquiler](#flujo-de-extensión-de-alquiler)

---

## Flujo de Venta de Agua

```mermaid
flowchart TD
    Start([Usuario inicia venta]) --> SelectDate[Seleccionar fecha]
    SelectDate --> AddProduct[Agregar producto al carrito]
    AddProduct --> ChooseProduct{Tipo de producto}
    
    ChooseProduct -->|Recarga| SelectLiters[Seleccionar litros<br/>1, 2, 5, 12, 19, 24]
    ChooseProduct -->|Botellón| AutoLiters[Automático: 19L]
    ChooseProduct -->|Tapa| NoLiters[Sin litros]
    
    SelectLiters --> SetQuantity[Definir cantidad]
    AutoLiters --> SetQuantity
    NoLiters --> SetQuantity
    
    SetQuantity --> CalcPrice[Calcular precio<br/>según litros]
    CalcPrice --> AddToCart[Agregar al carrito]
    
    AddToCart --> MoreProducts{¿Más productos?}
    MoreProducts -->|Sí| AddProduct
    MoreProducts -->|No| SelectPayment[Seleccionar método<br/>de pago]
    
    SelectPayment --> CalcTotal[Calcular total<br/>Bs y USD]
    CalcTotal --> ConfirmSale[Confirmar venta]
    
    ConfirmSale --> SaveSupabase{Guardar en<br/>Supabase}
    SaveSupabase -->|Éxito| UpdateLocal[Actualizar estado local]
    SaveSupabase -->|Error| SaveLocal[Guardar solo local]
    
    UpdateLocal --> ShowSuccess[Mostrar confirmación]
    SaveLocal --> ShowWarning[Mostrar advertencia]
    
    ShowSuccess --> ClearCart[Limpiar carrito]
    ShowWarning --> ClearCart
    ClearCart --> End([Fin])
```

---

## Flujo de Alquiler de Lavadora

```mermaid
---
id: 9f7643a2-4abf-4400-ad03-a9840b459126
---
flowchart TD
    Start([Crear alquiler]) --> SearchCustomer{¿Cliente existe?}
    
    SearchCustomer -->|Sí| SelectCustomer[Buscar y seleccionar<br/>cliente]
    SearchCustomer -->|No| CreateCustomer[Crear nuevo cliente]
    
    SelectCustomer --> AutoFill[Autocompletar datos<br/>nombre, teléfono, dirección]
    CreateCustomer --> AutoFill
    
    AutoFill --> SelectMachine[Seleccionar lavadora]
    SelectMachine --> SelectShift[Seleccionar jornada<br/>Medio/Completo/Doble]
    
    SelectShift --> SetDeliveryTime[Definir hora de entrega]
    SetDeliveryTime --> CalcPickup[Calcular hora de recogida<br/>+ duración de jornada]
    
    CalcPickup --> CheckHours{¿Dentro del<br/>horario laboral?}
    CheckHours -->|Sí| SetPickup[Establecer hora calculada]
    CheckHours -->|No| AdjustPickup[Ajustar a siguiente<br/>horario disponible]
    
    SetPickup --> SetDeliveryFee[Definir tarifa delivery<br/>$0-$5]
    AdjustPickup --> SetDeliveryFee
    
    SetDeliveryFee --> CalcTotal[Calcular total USD<br/>jornada + delivery]
    CalcTotal --> ConvertBs[Convertir a Bs<br/>según tasa del día]
    
    ConvertBs --> SelectPayment[Seleccionar método<br/>de pago]
    SelectPayment --> AddNotes[Agregar notas<br/>opcional]
    
    AddNotes --> SaveRental{Guardar en<br/>Supabase}
    SaveRental -->|Éxito| UpdateState[Actualizar estado local]
    SaveRental -->|Error| ShowError[Mostrar error]
    
    UpdateState --> SetStatus[Estado: Agendado]
    SetStatus --> ShowSuccess[Mostrar confirmación]
    ShowError --> End([Fin])
    ShowSuccess --> End
```

---

## Flujo de Agua Prepagada

```mermaid
---
id: 40d54216-6ffb-43bb-8282-690ff67bbc01
---
flowchart TD
    Start([Registrar prepago]) --> OpenForm[Abrir formulario]
    OpenForm --> EnterName[Ingresar nombre cliente]
    
    EnterName --> EnterLiters[Ingresar cantidad<br/>de litros]
    EnterLiters --> CalcPrice[Calcular precio<br/>según configuración]
    
    CalcPrice --> ShowPrice[Mostrar precio en Bs]
    ShowPrice --> SelectPayment[Seleccionar método<br/>de pago]
    
    SelectPayment --> AddNotes[Agregar notas<br/>opcional]
    AddNotes --> GetExchangeRate[Obtener tasa de cambio<br/>del día]
    
    GetExchangeRate --> CalcUSD[Calcular monto USD]
    CalcUSD --> SetDate[Establecer fecha de pago<br/>fecha actual]
    
    SetDate --> SetStatus[Estado: Pendiente]
    SetStatus --> SaveOrder{Guardar en<br/>Supabase}
    
    SaveOrder -->|Éxito| UpdateLocal[Actualizar estado local]
    SaveOrder -->|Error| SaveLocalOnly[Guardar solo local]
    
    UpdateLocal --> ShowSuccess[Mostrar confirmación]
    SaveLocalOnly --> ShowWarning[Mostrar advertencia]
    
    ShowSuccess --> CloseForm[Cerrar formulario]
    ShowWarning --> CloseForm
    CloseForm --> End([Fin])
```

### Flujo de Entrega de Prepago

```mermaid
flowchart TD
    Start([Marcar como entregado]) --> FindOrder[Localizar pedido<br/>pendiente]
    FindOrder --> ClickDeliver[Presionar botón<br/>Marcar Entregado]
    
    ClickDeliver --> ShowConfirm[Mostrar diálogo<br/>de confirmación]
    ShowConfirm --> UserConfirm{¿Usuario<br/>confirma?}
    
    UserConfirm -->|No| Cancel([Cancelar])
    UserConfirm -->|Sí| GetDate[Obtener fecha actual]
    
    GetDate --> UpdateStatus[Cambiar estado<br/>a Entregado]
    UpdateStatus --> SetDeliveryDate[Establecer fecha<br/>de entrega]
    
    SetDeliveryDate --> SaveUpdate{Actualizar en<br/>Supabase}
    SaveUpdate -->|Éxito| UpdateLocal[Actualizar estado local]
    SaveUpdate -->|Error| UpdateLocalOnly[Actualizar solo local]
    
    UpdateLocal --> ShowSuccess[Mostrar confirmación]
    UpdateLocalOnly --> ShowWarning[Mostrar advertencia]
    
    ShowSuccess --> RefreshList[Actualizar lista]
    ShowWarning --> RefreshList
    RefreshList --> End([Fin])
```

---

## Flujo de Configuración de Tasa

```mermaid
flowchart TD
    Start([Actualizar tasa]) --> OpenConfig[Abrir configuración]
    OpenConfig --> EnterRate[Ingresar nueva tasa]
    
    EnterRate --> Validate{¿Tasa > 0?}
    Validate -->|No| ShowError[Mostrar error]
    Validate -->|Sí| GetDate[Obtener fecha actual]
    
    ShowError --> EnterRate
    
    GetDate --> CheckHistory{¿Existe tasa<br/>para hoy?}
    CheckHistory -->|Sí| UpdateEntry[Actualizar entrada<br/>existente]
    CheckHistory -->|No| CreateEntry[Crear nueva entrada<br/>en historial]
    
    UpdateEntry --> UpdateConfig[Actualizar configuración<br/>global]
    CreateEntry --> UpdateConfig
    
    UpdateConfig --> SaveSupabase{Guardar en<br/>Supabase}
    SaveSupabase -->|Éxito| UpdateLocal[Actualizar estado local]
    SaveSupabase -->|Error| SaveLocalOnly[Guardar solo local]
    
    UpdateLocal --> ShowSuccess[Mostrar confirmación<br/>Tasa actualizada]
    SaveLocalOnly --> ShowWarning[Mostrar advertencia<br/>Guardado local]
    
    ShowSuccess --> UpdateTimestamp[Actualizar lastUpdated]
    ShowWarning --> UpdateTimestamp
    UpdateTimestamp --> End([Fin])
```

### Flujo de Actualización de Precios por Litros

```mermaid
flowchart TD
    Start([Actualizar precios]) --> OpenConfig[Abrir configuración]
    OpenConfig --> ModifyPrices[Modificar precios<br/>por breakpoint]
    
    ModifyPrices --> ClickSave[Presionar Guardar Precios]
    ClickSave --> ValidateAll{¿Todos los<br/>precios > 0?}
    
    ValidateAll -->|No| ShowError[Mostrar error<br/>Precios inválidos]
    ValidateAll -->|Sí| SaveSupabase{Guardar en<br/>Supabase}
    
    ShowError --> ModifyPrices
    
    SaveSupabase -->|Éxito| UpdateLocal[Actualizar estado local]
    SaveSupabase -->|Error| SaveLocalOnly[Guardar solo local]
    
    UpdateLocal --> ShowSuccess[Mostrar confirmación]
    SaveLocalOnly --> ShowWarning[Mostrar advertencia]
    
    ShowSuccess --> End([Fin])
    ShowWarning --> End
```

---

## Flujo de Gestión de Clientes

### Crear Cliente

```mermaid
flowchart TD
    Start([Crear cliente]) --> ClickFAB[Presionar botón +]
    ClickFAB --> OpenSheet[Abrir formulario]
    
    OpenSheet --> EnterName[Ingresar nombre<br/>obligatorio]
    EnterName --> EnterPhone[Ingresar teléfono<br/>opcional]
    EnterPhone --> EnterAddress[Ingresar dirección<br/>opcional]
    
    EnterAddress --> ClickSave[Presionar Guardar]
    ClickSave --> ValidateName{¿Nombre<br/>no vacío?}
    
    ValidateName -->|No| ShowError[Mostrar error]
    ValidateName -->|Sí| SaveSupabase{Guardar en<br/>Supabase}
    
    ShowError --> EnterName
    
    SaveSupabase -->|Éxito| UpdateLocal[Actualizar estado local]
    SaveSupabase -->|Error| SaveLocalOnly[Guardar solo local]
    
    UpdateLocal --> ShowSuccess[Mostrar confirmación]
    SaveLocalOnly --> ShowWarning[Mostrar advertencia]
    
    ShowSuccess --> CloseSheet[Cerrar formulario]
    ShowWarning --> CloseSheet
    CloseSheet --> RefreshList[Actualizar lista]
    RefreshList --> End([Fin])
```

### Buscar Cliente

```mermaid
flowchart TD
    Start([Buscar cliente]) --> EnterSearch[Escribir en campo<br/>de búsqueda]
    EnterSearch --> FilterReal[Filtrar en tiempo real]
    
    FilterReal --> SearchFields[Buscar en:<br/>- Nombre<br/>- Teléfono<br/>- Dirección]
    SearchFields --> ShowResults{¿Hay<br/>resultados?}
    
    ShowResults -->|Sí| DisplayList[Mostrar lista<br/>filtrada]
    ShowResults -->|No| ShowEmpty[Mostrar mensaje<br/>No encontrado]
    
    DisplayList --> End([Fin])
    ShowEmpty --> End
```

---

## Flujo de Seguimiento de Alquileres

```mermaid
flowchart TD
    Start([Abrir seguimiento]) --> LoadRentals[Cargar todos<br/>los alquileres]
    
    LoadRentals --> FilterUnpaid[Filtrar no pagados<br/>isPaid = false<br/>status ≠ finalizado]
    LoadRentals --> FilterScheduled[Filtrar agendados<br/>status = agendado]
    LoadRentals --> FilterSent[Filtrar enviados<br/>status = enviado]
    
    FilterUnpaid --> DisplayUnpaid[Mostrar sección<br/>No Pagados<br/>badge rojo]
    FilterScheduled --> DisplayScheduled[Mostrar sección<br/>Lavadoras Agendadas<br/>badge azul]
    FilterSent --> DisplaySent[Mostrar sección<br/>Lavadoras Enviadas<br/>badge verde]
    
    DisplayUnpaid --> ShowCounts[Mostrar contadores]
    DisplayScheduled --> ShowCounts
    DisplaySent --> ShowCounts
    
    ShowCounts --> UserAction{Acción del<br/>usuario}
    
    UserAction -->|Marcar pagado| MarkPaid[Registrar pago]
    UserAction -->|Cambiar estado| ChangeStatus[Actualizar estado]
    UserAction -->|Extender| ExtendRental[Extender tiempo]
    UserAction -->|Ver detalles| ShowDetails[Mostrar información]
    
    MarkPaid --> UpdateDB[Actualizar en Supabase]
    ChangeStatus --> UpdateDB
    ExtendRental --> UpdateDB
    
    UpdateDB --> RefreshView[Actualizar vista]
    ShowDetails --> End([Fin])
    RefreshView --> End
```

---

## Flujo de Extensión de Alquiler

```mermaid
flowchart TD
    Start([Extender alquiler]) --> CheckEligible{¿Alquiler<br/>elegible?}
    
    CheckEligible -->|No| ShowError[Mostrar error<br/>No se puede extender]
    CheckEligible -->|Sí| OpenDialog[Abrir diálogo<br/>de extensión]
    
    ShowError --> End([Fin])
    
    OpenDialog --> ShowCurrent[Mostrar datos actuales:<br/>- Hora recogida actual<br/>- Precio actual]
    ShowCurrent --> SelectType[Seleccionar tipo:<br/>Medio/Completo/Doble]
    
    SelectType --> CalcNewTime[Calcular nueva hora<br/>hora actual + duración]
    CalcNewTime --> CheckHours{¿Dentro del<br/>horario laboral?}
    
    CheckHours -->|Sí| SetNewTime[Establecer nueva hora]
    CheckHours -->|No| AdjustTime[Ajustar a horario<br/>disponible]
    
    SetNewTime --> CalcCost[Calcular costo<br/>adicional]
    AdjustTime --> CalcCost
    
    CalcCost --> ShowSummary[Mostrar resumen:<br/>- Nueva hora<br/>- Nueva fecha<br/>- Costo adicional<br/>- Total actualizado]
    
    ShowSummary --> UserConfirm{¿Usuario<br/>confirma?}
    UserConfirm -->|No| Cancel([Cancelar])
    UserConfirm -->|Sí| SaveOriginal[Guardar hora original<br/>si es primera extensión]
    
    SaveOriginal --> UpdateRental[Actualizar alquiler:<br/>- pickupTime<br/>- pickupDate<br/>- totalUsd<br/>- extensions[]]
    
    UpdateRental --> SaveSupabase{Guardar en<br/>Supabase}
    SaveSupabase -->|Éxito| UpdateLocal[Actualizar estado local]
    SaveSupabase -->|Error| UpdateLocalOnly[Actualizar solo local]
    
    UpdateLocal --> ShowSuccess[Mostrar confirmación]
    UpdateLocalOnly --> ShowWarning[Mostrar advertencia]
    
    ShowSuccess --> CloseDialog[Cerrar diálogo]
    ShowWarning --> CloseDialog
    CloseDialog --> RefreshView[Actualizar vista]
    RefreshView --> End
```

---

## Flujo de Cambio de Estado de Alquiler

```mermaid
flowchart TD
    Start([Cambiar estado]) --> CheckCurrent{Estado<br/>actual}
    
    CheckCurrent -->|Agendado| ToSent[Cambiar a Enviado]
    CheckCurrent -->|Enviado| ToFinished[Cambiar a Finalizado]
    CheckCurrent -->|Finalizado| NoChange[No se puede cambiar]
    
    NoChange --> End([Fin])
    
    ToSent --> ShowConfirm1[Mostrar confirmación<br/>¿Cambiar a Enviado?]
    ToFinished --> ShowConfirm2[Mostrar confirmación<br/>¿Cambiar a Finalizado?]
    
    ShowConfirm1 --> UserConfirm{¿Usuario<br/>confirma?}
    ShowConfirm2 --> UserConfirm
    
    UserConfirm -->|No| Cancel([Cancelar])
    UserConfirm -->|Sí| UpdateStatus[Actualizar estado]
    
    UpdateStatus --> SaveSupabase{Guardar en<br/>Supabase}
    SaveSupabase -->|Éxito| UpdateLocal[Actualizar estado local]
    SaveSupabase -->|Error| UpdateLocalOnly[Actualizar solo local]
    
    UpdateLocal --> InvalidateCache[Invalidar cache<br/>de alquileres]
    UpdateLocalOnly --> InvalidateCache
    
    InvalidateCache --> ShowSuccess[Mostrar confirmación]
    ShowSuccess --> RefreshView[Actualizar vista]
    RefreshView --> End
```

---

## Notas sobre los Diagramas

### Convenciones Utilizadas:
- **Rectángulos redondeados**: Inicio/Fin del flujo
- **Rectángulos**: Procesos o acciones
- **Rombos**: Decisiones o validaciones
- **Colores implícitos**: 
  - Verde: Éxito
  - Rojo: Error
  - Amarillo: Advertencia
  - Azul: Información

### Patrones Comunes:
1. **Validación antes de guardar**: Todos los flujos validan datos antes de persistir
2. **Doble persistencia**: Se intenta guardar en Supabase, con fallback a local
3. **Feedback al usuario**: Siempre se muestra confirmación o error
4. **Sincronización**: Los cambios se reflejan inmediatamente en la UI

### Cómo Visualizar:
Estos diagramas están en formato Mermaid. Puedes visualizarlos en:
- GitHub (renderiza automáticamente)
- VS Code (con extensión Mermaid)
- Sitios web como mermaid.live
- Documentación generada con herramientas que soporten Mermaid
