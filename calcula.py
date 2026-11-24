
IGV = 0.18
DESCUENTO_MAXIMO = 50


nombre = input("Ingrese el nombre del producto: ")
precio = float(input("Ingrese el precio del producto: "))
cantidad = int(input("Ingrese la cantidad del producto: "))
descuento = float(input("Ingrese el porcentaje de descuento : "))


if descuento > DESCUENTO_MAXIMO:
    descuento = DESCUENTO_MAXIMO
  



subtotal = precio * cantidad

monto_descuento = subtotal * (descuento / 100)

subtotal_descuento = subtotal - monto_descuento

monto_igv = subtotal_descuento * IGV

total = subtotal_descuento + monto_igv


print("Producto:", nombre)
print("Precio: ", precio)
print("Cantidad:", cantidad)
print("Subtotal: ", subtotal)
print("Descuento:" , monto_descuento)
print("IGV: ", monto_igv)
print("Total a pagar: ", total)
