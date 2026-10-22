public class Usuario {
    private String nombre;
    private double porcentajeComision;  // Ej. 0.05 para 5%

    public Usuario(String nombre, double porcentajeComision) {
        this.nombre = nombre;
        this.porcentajeComision = porcentajeComision;
    }

    // Getters y setters
    public String getNombre() { return nombre; }
    public double getPorcentajeComision() { return porcentajeComision; }

    @Override
    public String toString() {
        return nombre + " (Comisión: " + (porcentajeComision * 100) + "%)";
    }
}